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
  ) {}

  async checkout(
    userId: string,
    payload: {
      deliveryAddress?: string;
      note?: string;
      promoCode?: string;
      cartItemIds?: string[];
      deliveryOption?: DeliveryOption;
    },
  ): Promise<Order> {
    const cart = await this.cartRepo.findOne({
      where: { userId, isActive: true },
      relations: ['items'],
    });

    if (!cart || cart.items.length === 0) {
      throw new BadRequestException('Cart is empty');
    }

    const requestedItemIds = new Set(payload.cartItemIds ?? []);
    const selectedCartItems = requestedItemIds.size
      ? cart.items.filter((item) => requestedItemIds.has(item.id))
      : cart.items;

    if (!selectedCartItems.length) {
      throw new BadRequestException('No cart item selected for checkout');
    }

    if (
      requestedItemIds.size > 0 &&
      selectedCartItems.length !== requestedItemIds.size
    ) {
      throw new BadRequestException('Some selected cart items are invalid');
    }

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
          unitPrice: product.unitPrice,
          quantity: item.quantity,
          lineTotal: Number(product.unitPrice) * Number(item.quantity),
        };
      }),
    );

    const cartSubtotal = Number(
      pricedItems.reduce((sum, item) => sum + item.lineTotal, 0).toFixed(2),
    );

    const deliveryOption = payload.deliveryOption ?? DeliveryOption.OTHER;
    let promoDiscount = 0;
    let promoCode: string | undefined;

    if (payload.promoCode?.trim()) {
      const promo = await this.promotionService.findActiveByCode(
        payload.promoCode,
      );
      if (!promo) {
        throw new BadRequestException('Code promo invalide ou expiré');
      }

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

      if (promo.type === PromotionType.PERCENT) {
        promoDiscount = (eligibleSubtotal * Number(promo.value)) / 100;
      } else {
        promoDiscount = Number(promo.value);
      }

      promoDiscount = Number(
        Math.max(0, Math.min(promoDiscount, eligibleSubtotal)).toFixed(2),
      );
      promoCode = promo.code;
    }

    const discountedSubtotal = Number(
      Math.max(0, cartSubtotal - promoDiscount).toFixed(2),
    );

    let deliveryFee = 0;

    if (deliveryOption === DeliveryOption.CEXPRESS) {
      const quote = await this.cexpressService.quoteDelivery({
        deliveryAddress: payload.deliveryAddress,
        orderTotal: discountedSubtotal,
      });

      deliveryFee = Number(quote.fee ?? 0);
    }

    const order = this.orderRepo.create({
      userId,
      totalAmount: discountedSubtotal,
      promoCode,
      promoDiscount,
      deliveryOption,
      deliveryFee,
      status: OrderStatus.PENDING,
      deliveryAddress: payload.deliveryAddress,
      note: payload.note,
      items: pricedItems.map((item) =>
        this.itemRepo.create({
          productId: item.productId,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
        }),
      ),
    });

    const selectedIds = new Set(selectedCartItems.map((item) => item.id));
    const remainingItems = cart.items.filter(
      (item) => !selectedIds.has(item.id),
    );
    const removedItems = cart.items.filter((item) => selectedIds.has(item.id));

    if (removedItems.length > 0) {
      await this.cartItemRepo.remove(removedItems);
    }

    cart.items = remainingItems;
    cart.totalAmount = remainingItems.reduce(
      (sum, item) => sum + Number(item.unitPrice) * Number(item.quantity),
      0,
    );
    cart.isActive = remainingItems.length > 0;
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

  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    if (event.referenceType !== PaymentReferenceType.SHOP_ORDER) return;

    try {
      await this.updateStatus(event.referenceId, OrderStatus.PAID);

      // Créer livraison C'Express si option CEXPRESS choisie
      const order = await this.findOne(event.referenceId);
      if (
        order.deliveryOption === DeliveryOption.CEXPRESS &&
        order.deliveryAddress
      ) {
        const delivery = await this.cexpressService.createDelivery({
          orderId: order.id,
          dropoff: order.deliveryAddress,
          amountToCollect: 0,
        });
        this.logger.log(`[C'EXPRESS] Livraison créée pour commande ${order.id}: ${delivery.deliveryId}`);
      }
    } catch (err) {
      this.logger.error(
        `Erreur gestion paiement SHOP_ORDER ${event.referenceId}`,
        err,
      );
    }
  }
}
