import {
  Injectable,
  BadRequestException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { Order, DeliveryOption } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { OrderStatus } from './order-status.enum';
import { PromotionService } from '../promotion/promotion.service';
import { PromotionType } from '../promotion/promotion-type.enum';
import { ProductService } from '../product/product.service';
import { CexpressService } from 'src/express/express.service';
import { RelayPointService } from '../relay-point/relay-point.service';
import { PaymentSuccessEvent } from 'src/core/payments/events/payment-success.event';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';

@Injectable()
export class OrderService {
  private readonly logger = new Logger(OrderService.name);

  constructor(
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,

    @InjectRepository(OrderItem)
    private readonly itemRepo: Repository<OrderItem>,

    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly cartItemRepo: Repository<CartItem>,

    private readonly cexpressService: CexpressService,
    private readonly promotionService: PromotionService,
    private readonly productService: ProductService,
    private readonly relayPointService: RelayPointService,
  ) {}

  /**
   * Flux complet de passage de commande (checkout) en 6 étapes :
   * 1. Récupération et validation du panier
   * 2. Vérification du stock et des prix en temps réel
   * 3. Application du code promo (si fourni)
   * 4. Calcul des frais de livraison selon le mode choisi
   * 5. Création de la commande en base
   * 6. Nettoyage du panier (suppression des articles commandés)
   *
   * La commande est créée avec statut PENDING — le paiement la fait passer à PAID
   * via l'événement 'payment.success' écouté par handlePaymentSuccess().
   */
  async checkout(
    userId: string,
    payload: {
      deliveryAddress?: string;
      note?: string;
      promoCode?: string;
      cartItemIds?: string[];    // Si fournis, ne commande que ces articles (checkout partiel)
      deliveryOption?: DeliveryOption;
      relayPointId?: string;     // Requis si deliveryOption === RELAY
    },
  ): Promise<Order> {
    // ÉTAPE 1 : Récupération du panier actif avec ses articles
    const cart = await this.cartRepo.findOne({
      where: { userId, isActive: true },
      relations: ['items'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    // Sélection partielle : si cartItemIds fournis, ne commande que ces articles
    const requestedItemIds = new Set(payload.cartItemIds ?? []);
    const selectedCartItems = requestedItemIds.size
      ? cart.items.filter((item) => requestedItemIds.has(item.id))
      : cart.items; // Sinon, commande tout le panier

    if (!selectedCartItems.length) {
      throw new BadRequestException('No cart item selected for checkout');
    }

    if (
      requestedItemIds.size > 0 &&
      selectedCartItems.length !== requestedItemIds.size
    ) {
      throw new BadRequestException('Some selected cart items are invalid');
    }

    // ÉTAPE 2 : Vérification du stock et récupération des prix actuels
    // getCheckoutSnapshot() retourne le prix et le stock en temps réel (pas celui du panier)
    const pricedItems = await Promise.all(
      selectedCartItems.map(async (item) => {
        const product = await this.productService.getCheckoutSnapshot(
          item.productId,
        );
        if (!product.isActive) {
          throw new BadRequestException(
            `Produit indisponible: ${product.name}`,
          );
        }
        if (item.quantity > product.stock) {
          throw new BadRequestException(
            `Stock insuffisant pour ${product.name}`,
          );
        }
        return {
          productId: product.id,
          productName: product.name,
          unitPrice: product.unitPrice,        // Prix actuel du produit (snapshot au moment de la commande)
          quantity: item.quantity,
          lineTotal: Number(product.unitPrice) * Number(item.quantity),
        };
      }),
    );

    // Sous-total brut = somme de toutes les lignes (arrondi à 2 décimales)
    const cartSubtotal = Number(
      pricedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );

    const deliveryOption = payload.deliveryOption ?? DeliveryOption.FREE;
    let promoDiscount = 0;
    let promoCode: string | undefined;

    // ÉTAPE 3 : Application du code promo (optionnel)
    if (payload.promoCode?.trim()) {
      const promo = await this.promotionService.findActiveByCode(
        payload.promoCode,
      );
      if (!promo) {
        throw new BadRequestException('Code promo invalide ou expiré');
      }

      // Si la promo est liée à des produits spécifiques, calcule le sous-total éligible
      const eligibleProductIds = new Set(
        (promo.products ?? []).map((p) => p.id),
      );
      const eligibleSubtotal = pricedItems.reduce((sum, item) => {
        if (!eligibleProductIds.has(item.productId)) return sum;
        return sum + Number(item.lineTotal);
      }, 0);

      if (eligibleSubtotal <= 0) {
        throw new BadRequestException(
          "Ce code promo n'est applicable à aucun produit du panier",
        );
      }

      // Applique la remise selon le type : PERCENT (%) ou FIXED (montant fixe)
      if (promo.type === PromotionType.PERCENT) {
        promoDiscount = (eligibleSubtotal * Number(promo.value)) / 100;
      } else {
        promoDiscount = Number(promo.value);
      }

      // Plafonne la remise au sous-total éligible (ne peut pas créer un montant négatif)
      promoDiscount = Number(
        Math.max(0, Math.min(promoDiscount, eligibleSubtotal)).toFixed(2),
      );
      promoCode = promo.code;
    }

    // Sous-total après remise (ne peut pas être négatif)
    const discountedSubtotal = Number(
      Math.max(0, cartSubtotal - promoDiscount).toFixed(2),
    );

    // ÉTAPE 4 : Calcul des frais de livraison selon le mode
    let deliveryFee = 0;
    let relayPointId: string | undefined;

    if (deliveryOption === DeliveryOption.CEXPRESS) {
      // Livraison C'Express : tarif calculé dynamiquement par CexpressService
      if (!payload.deliveryAddress) {
        throw new BadRequestException(
          "Une adresse de livraison est requise pour C'Express",
        );
      }
      const quote = await this.cexpressService.quoteDelivery({
        deliveryAddress: payload.deliveryAddress,
        orderTotal: discountedSubtotal,
      });
      deliveryFee = Number(quote.fee ?? 0);
    } else if (deliveryOption === DeliveryOption.RELAY) {
      // Retrait point relais : gratuit, mais le point relais doit exister et être actif
      if (!payload.relayPointId) {
        throw new BadRequestException(
          'Veuillez sélectionner un point relais',
        );
      }
      // findOne() lève une NotFoundException si le point relais n'existe pas ou est inactif
      await this.relayPointService.findOne(payload.relayPointId);
      relayPointId = payload.relayPointId;
      deliveryFee = 0;
    } else if (deliveryOption === DeliveryOption.WAREHOUSE) {
      deliveryFee = 0; // Retrait entrepôt : gratuit
    } else {
      deliveryFee = 0; // FREE : livraison gratuite
    }

    // ÉTAPE 5 : Création de la commande en base (statut PENDING jusqu'au paiement)
    const order = this.orderRepo.create({
      userId,
      totalAmount: discountedSubtotal, // Montant hors frais de livraison
      promoCode,
      promoDiscount,
      deliveryOption,
      deliveryFee,
      status: OrderStatus.PENDING,
      deliveryAddress: payload.deliveryAddress,
      relayPointId,
      note: payload.note,
      // Les lignes de commande sont créées en cascade avec la commande
      items: pricedItems.map((item) =>
        this.itemRepo.create({
          productId: item.productId,
          productName: item.productName, // Snapshot du nom au moment de la commande
          unitPrice: item.unitPrice,     // Snapshot du prix au moment de la commande
          quantity: item.quantity,
        }),
      ),
    });

    // ÉTAPE 6 : Nettoyage du panier — supprime uniquement les articles commandés
    const selectedIds = new Set(selectedCartItems.map((item) => item.id));
    const remainingItems = cart.items.filter(
      (item) => !selectedIds.has(item.id),
    );
    const removedItems = cart.items.filter((item) => selectedIds.has(item.id));

    if (removedItems.length > 0) {
      await this.cartItemRepo.remove(removedItems);
    }

    // Met à jour le panier : recalcule le total et désactive si vide
    cart.items = remainingItems;
    cart.totalAmount = remainingItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
      0,
    );
    cart.isActive = remainingItems.length > 0; // Panier inactif si plus aucun article
    await this.cartRepo.save(cart);

    return this.orderRepo.save(order);
  }

  async findUserOrders(userId: string): Promise<Order[]> {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllOrders(): Promise<Order[]> {
    return this.orderRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(orderId: string): Promise<Order> {
    const order = await this.orderRepo.findOne({
      where: { id: orderId },
    });

    if (!order) {
      throw new NotFoundException('Order not found');
    }

    return order;
  }

  async updateStatus(orderId: string, status: OrderStatus): Promise<Order> {
    const order = await this.findOne(orderId);

    order.status = status;

    if (status === OrderStatus.PAID) {
      order.isPaid = true;
    }

    return this.orderRepo.save(order);
  }

  /**
   * Réagit à l'événement 'payment.success' émis par PaymentsService.
   *
   * Ce décorateur @OnEvent découple la logique post-paiement du module Payments :
   * PaymentsService n'importe pas OrderService → pas de dépendance circulaire.
   *
   * Actions effectuées après paiement d'une commande C'Shop :
   * 1. Passe la commande au statut PAID
   * 2. Si livraison C'Express : crée automatiquement le bon de livraison
   * 3. Si point relais ou entrepôt : log pour suivi manuel
   */
  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    // Filtre : réagit uniquement aux paiements de commandes C'Shop
    if (event.referenceType !== PaymentReferenceType.SHOP_ORDER) return;

    try {
      // Met à jour le statut + isPaid = true
      await this.updateStatus(event.referenceId, OrderStatus.PAID);

      const order = await this.findOne(event.referenceId);

      if (order.deliveryOption === DeliveryOption.CEXPRESS && order.deliveryAddress) {
        // Crée automatiquement une livraison dans le module C'Express
        const delivery = await this.cexpressService.createDelivery({
          orderId: order.id,
          dropoff: order.deliveryAddress,
          amountToCollect: 0, // Déjà payé en ligne
        });
        this.logger.log(`[CEXPRESS] Livraison créée pour commande ${order.id}: ${delivery.deliveryId}`);
      } else if (order.deliveryOption === DeliveryOption.RELAY) {
        // Le client viendra récupérer sa commande au point relais
        this.logger.log(`[RELAY] Commande ${order.id} — retrait point relais: ${order.relayPointId ?? 'N/A'}`);
      } else if (order.deliveryOption === DeliveryOption.WAREHOUSE) {
        // Le client viendra chercher en entrepôt
        this.logger.log(`[WAREHOUSE] Commande ${order.id} — retrait en entrepôt`);
      } else {
        this.logger.log(`[FREE] Commande ${order.id} — livraison gratuite`);
      }
    } catch (err) {
      // L'erreur est loguée mais pas propagée : l'événement ne doit pas faire planter le système
      this.logger.error(
        `Erreur gestion paiement SHOP_ORDER ${event.referenceId}`,
        err,
      );
    }
  }
}
