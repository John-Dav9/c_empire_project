import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { GrillOrder } from '../entities/grill-order.entity';
import { GrillOrderItem } from '../entities/grill-order-item.entity';
import { GrillProduct } from '../entities/grill-product.entity';
import { GrillMenuPack } from '../entities/grill-menu-pack.entity';

import { CreateGrillOrderDto } from '../dto/create-grill-order.dto';
import { GrillOrderStatus } from '../enums/grill-order-status.enum';
import { GrillDeliveryMode } from '../enums/grill-delivery-mode.enum';
import { PaymentSuccessEvent } from 'src/core/payments/events/payment-success.event';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';
import { CexpressService } from 'src/express/express.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';

@Injectable()
export class GrillOrdersService {
  private readonly logger = new Logger(GrillOrdersService.name);

  constructor(
    @InjectRepository(GrillOrder)
    private readonly orderRepo: Repository<GrillOrder>,

    @InjectRepository(GrillOrderItem)
    private readonly itemRepo: Repository<GrillOrderItem>,

    @InjectRepository(GrillProduct)
    private readonly productRepo: Repository<GrillProduct>,

    @InjectRepository(GrillMenuPack)
    private readonly packRepo: Repository<GrillMenuPack>,

    private readonly cexpressService: CexpressService,
    private readonly notificationsService: NotificationsService,
  ) {}

  // =========================
  // CREATE ORDER (PRODUCTS + PACKS)
  // =========================
  findByUser(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async create(dto: CreateGrillOrderDto, userId?: string) {
    if (!dto.items?.length) {
      throw new BadRequestException('Aucun article');
    }

    if (dto.deliveryMode === GrillDeliveryMode.DELIVERY && !dto.address) {
      throw new BadRequestException('Adresse obligatoire pour la livraison');
    }

    const orderItems: GrillOrderItem[] = [];
    let subtotal = 0;

    for (const line of dto.items) {
      if (!line.qty || line.qty <= 0) {
        throw new BadRequestException('Quantité invalide');
      }

      // =====================
      // CAS 1 : PRODUIT SIMPLE
      // =====================
      if (line.productId) {
        const product = await this.productRepo.findOne({
          where: { id: line.productId },
        });

        if (!product) {
          throw new BadRequestException('Produit introuvable');
        }

        if (!product.isAvailable) {
          throw new BadRequestException(
            `Produit indisponible: ${product.title}`,
          );
        }

        if (
          typeof product.stockQty === 'number' &&
          product.stockQty < line.qty
        ) {
          throw new BadRequestException(`Stock insuffisant: ${product.title}`);
        }

        const unitPrice = Number(product.price);
        const lineTotal = unitPrice * line.qty;

        subtotal += lineTotal;

        orderItems.push(
          this.itemRepo.create({
            productId: product.id,
            titleSnapshot: product.title,
            unitPriceSnapshot: unitPrice,
            qty: line.qty,
            lineTotal,
          }),
        );
      }

      // =====================
      // CAS 2 : MENU PACK (PRIX PACK)
      // =====================
      else if (line.menupackId) {
        const pack = await this.packRepo.findOne({
          where: { id: line.menupackId },
          relations: { items: true },
        });

        if (!pack) {
          throw new BadRequestException('Menu pack introuvable');
        }

        if (!pack.isAvailable) {
          throw new BadRequestException(
            `Menu pack indisponible: ${pack.title}`,
          );
        }

        const packTotal = Number(pack.price) * line.qty;
        subtotal += packTotal;

        // Snapshot "virtuel" du pack (pour lecture admin / facture)
        orderItems.push(
          this.itemRepo.create({
            productId: pack.id,
            titleSnapshot: `[MENU] ${pack.title}`,
            unitPriceSnapshot: Number(pack.price),
            qty: line.qty,
            lineTotal: packTotal,
          }),
        );

        // Déplier le pack pour le stock
        for (const packItem of pack.items) {
          const product = await this.productRepo.findOne({
            where: { id: packItem.productId },
          });

          if (!product) {
            throw new BadRequestException(
              `Produit du pack introuvable: ${packItem.productId}`,
            );
          }

          const totalQty = packItem.qty * line.qty;

          if (
            typeof product.stockQty === 'number' &&
            product.stockQty < totalQty
          ) {
            throw new BadRequestException(
              `Stock insuffisant pour le pack (${product.title})`,
            );
          }
        }
      } else {
        throw new BadRequestException(
          'Chaque ligne doit contenir productId ou menuPackId',
        );
      }
    }

    const deliveryFee =
      dto.deliveryMode === GrillDeliveryMode.DELIVERY ? 1500 : 0;

    const total = subtotal + deliveryFee;

    const order = this.orderRepo.create({
      userId,
      fullName: dto.fullName,
      email: dto.email,
      phone: dto.phone,
      deliveryMode: dto.deliveryMode,
      address: dto.address,
      currency: 'XAF',
      subtotal,
      deliveryFee,
      total,
      status: GrillOrderStatus.PENDING,
      items: orderItems,
    });

    return this.orderRepo.save(order);
  }

  // =========================
  // ADMIN & COMMON
  // =========================
  findAllAdmin() {
    return this.orderRepo.find({
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({
      where: { id },
      relations: { items: true },
    });

    if (!order) {
      throw new NotFoundException('Commande introuvable');
    }

    return order;
  }

  async updateStatus(id: string, status: GrillOrderStatus) {
    const order = await this.findOne(id);
    order.status = status;
    const saved = await this.orderRepo.save(order);

    try {
      const labels: Partial<Record<GrillOrderStatus, string>> = {
        [GrillOrderStatus.CONFIRMED]:        'Confirmée',
        [GrillOrderStatus.PREPARING]:        'En préparation',
        [GrillOrderStatus.READY]:            'Prête à récupérer',
        [GrillOrderStatus.OUT_FOR_DELIVERY]: 'En cours de livraison',
        [GrillOrderStatus.DELIVERED]:        'Livrée',
        [GrillOrderStatus.CANCELLED]:        'Annulée',
      };
      const label = labels[status];
      if (label) {
        if (order.userId) {
          await this.notificationsService.sendNotification({
            userId: order.userId,
            title: `Commande C'Grill — ${label}`,
            message: `Votre commande #${id.substring(0, 8)} est maintenant : ${label}.`,
            channel: 'IN_APP',
          });
        }
        if (order.email) {
          await this.notificationsService.sendNotification({
            to: order.email,
            title: `Commande C'Grill — ${label}`,
            message: `Votre commande #${id.substring(0, 8)} est maintenant : ${label}.`,
            channel: 'EMAIL',
          });
        }
      }
    } catch (err) {
      this.logger.warn(`Notification échec commande grill ${id}`, err);
    }

    return saved;
  }

  // =========================
  // PAYMENT SUCCESS HANDLER
  // =========================
  async markAsPaid(orderId: string, paymentId: string) {
    const order = await this.findOne(orderId);

    order.paymentId = paymentId;
    order.status = GrillOrderStatus.PAID;
    await this.orderRepo.save(order);

    try {
      if (order.userId) {
        await this.notificationsService.sendNotification({
          userId: order.userId,
          title: "Commande C'Grill — Paiement confirmé",
          message: `Votre commande #${orderId.substring(0, 8)} a été payée. Nous préparons votre commande.`,
          channel: 'IN_APP',
        });
      }
      if (order.email) {
        await this.notificationsService.sendNotification({
          to: order.email,
          title: "Commande C'Grill — Paiement confirmé",
          message: `Votre commande #${orderId.substring(0, 8)} a été payée. Nous préparons votre commande.`,
          channel: 'EMAIL',
        });
      }
    } catch (err) {
      this.logger.warn(`Notification paiement grill ${orderId}`, err);
    }

    // Déduction stock (produits simples + packs déjà vérifiés)
    for (const it of order.items) {
      const product = await this.productRepo.findOne({
        where: { id: it.productId },
      });

      if (product && typeof product.stockQty === 'number') {
        product.stockQty = Math.max(0, product.stockQty - it.qty);
        if (product.stockQty === 0) {
          product.isAvailable = false;
        }
        await this.productRepo.save(product);
      }
    }

    return order;
  }

  // =========================
  // DELIVERY (C'EXPRESS)
  // =========================
  async attachExpressDelivery(orderId: string, expressOrderId: string) {
    const order = await this.findOne(orderId);
    order.expressOrderId = expressOrderId;
    order.status = GrillOrderStatus.OUT_FOR_DELIVERY;
    return this.orderRepo.save(order);
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    if (event.referenceType !== PaymentReferenceType.GRILLFOOD_ORDER) return;

    try {
      await this.markAsPaid(event.referenceId, event.paymentId);

      const order = await this.findOne(event.referenceId);
      if (order.deliveryMode === GrillDeliveryMode.DELIVERY && order.address) {
        const delivery = await this.cexpressService.createDelivery({
          orderId: order.id,
          dropoff: order.address,
          amountToCollect: 0,
        });
        await this.attachExpressDelivery(order.id, delivery.deliveryId);
        this.logger.log(`[C'EXPRESS] Livraison grill créée: ${delivery.deliveryId}`);
      }
    } catch (err) {
      this.logger.error(
        `Erreur gestion paiement GRILLFOOD_ORDER ${event.referenceId}`,
        err,
      );
    }
  }

  async syncDeliveryStatusFromExpress(orderId: string, deliveryStatus: string) {
    const order = await this.findOne(orderId);

    if (deliveryStatus === 'DELIVERED') {
      order.status = GrillOrderStatus.DELIVERED;
    }

    if (deliveryStatus === 'IN_PROGRESS') {
      order.status = GrillOrderStatus.OUT_FOR_DELIVERY;
    }

    if (deliveryStatus === 'CANCELLED') {
      order.status = GrillOrderStatus.CANCELLED;
    }

    return this.orderRepo.save(order);
  }
}
