import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { DeliveryEntity } from '../entities/delivery.entity';
import { CreateDeliveryDto } from '../dto/create-delivery.dto';
import { DeliveryStatus } from '../enums/delivery-status.enum';
import { PricingService } from './pricing.service';
import { PaymentSuccessEvent } from 'src/core/payments/events/payment-success.event';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';

@Injectable()
export class DeliveryService {
  private readonly logger = new Logger(DeliveryService.name);

  constructor(
    @InjectRepository(DeliveryEntity)
    private readonly deliveryRepo: Repository<DeliveryEntity>,
    private readonly pricingService: PricingService,
  ) {}

  /**
   * USER - Créer une livraison
   * Règle: création => PENDING, paid=false, price calculé
   */
  async create(
    userId: string,
    dto: CreateDeliveryDto,
  ): Promise<DeliveryEntity> {
    const weightKg = dto.weightKg ?? 0;
    const distanceKm = dto.distanceKm ?? 0;
    const urgencyLevel = dto.urgencyLevel ?? 1;

    const price = this.pricingService.calculateDeliveryPrice({
      distanceKm,
      weightKg,
      urgencyLevel,
    });

    const delivery = this.deliveryRepo.create({
      userId,
      pickupAddress: dto.pickupAddress,
      deliveryAddress: dto.deliveryAddress,

      pickupLat: dto.pickupLat,
      pickupLng: dto.pickupLng,
      deliveryLat: dto.deliveryLat,
      deliveryLng: dto.deliveryLng,

      packageType: dto.packageType,
      weightKg,
      distanceKm,
      urgencyLevel,

      price,
      paid: false,
      status: DeliveryStatus.PENDING,

      customerNote: dto.customerNote,
    });

    return this.deliveryRepo.save(delivery);
  }

  /**
   * USER - Mes livraisons
   */
  async findMy(userId: string): Promise<DeliveryEntity[]> {
    return this.deliveryRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  /**
   * USER/ADMIN - Détails livraison
   * Si user: il ne peut voir que sa livraison
   */
  async findOneOrFail(id: string): Promise<DeliveryEntity> {
    const delivery = await this.deliveryRepo.findOne({ where: { id } });
    if (!delivery) throw new NotFoundException('Delivery not found');
    return delivery;
  }

  async findOneForUserOrFail(
    userId: string,
    id: string,
  ): Promise<DeliveryEntity> {
    const delivery = await this.findOneOrFail(id);
    if (delivery.userId !== userId) {
      throw new ForbiddenException('Access denied');
    }
    return delivery;
  }

  /**
   * USER - Annuler (uniquement si pas encore IN_TRANSIT / DELIVERED)
   */
  async cancel(userId: string, id: string): Promise<DeliveryEntity> {
    const delivery = await this.findOneForUserOrFail(userId, id);

    if (delivery.status === DeliveryStatus.DELIVERED) {
      throw new BadRequestException('Cannot cancel a delivered delivery');
    }
    if (delivery.status === DeliveryStatus.IN_TRANSIT) {
      throw new BadRequestException(
        'Cannot cancel: delivery already in transit',
      );
    }

    // Optionnel: si déjà payée, on peut créer un flow "refund requested" plus tard
    delivery.status = DeliveryStatus.CANCELED;

    return this.deliveryRepo.save(delivery);
  }

  /**
   * ADMIN - Lister toutes les livraisons
   */
  async adminFindAll(params?: {
    status?: DeliveryStatus;
    courierId?: string;
    userId?: string;
  }): Promise<DeliveryEntity[]> {
    const qb = this.deliveryRepo
      .createQueryBuilder('d')
      .orderBy('d.createdAt', 'DESC');

    if (params?.status)
      qb.andWhere('d.status = :status', { status: params.status });
    if (params?.courierId)
      qb.andWhere('d.courierId = :courierId', { courierId: params.courierId });
    if (params?.userId)
      qb.andWhere('d.userId = :userId', { userId: params.userId });

    return qb.getMany();
  }

  /**
   * ADMIN - Assigner un livreur
   * Règle: doit être au minimum CONFIRMED (donc payée/validée)
   */
  async adminAssignCourier(
    deliveryId: string,
    courierId: string,
  ): Promise<DeliveryEntity> {
    const delivery = await this.findOneOrFail(deliveryId);

    if (delivery.status === DeliveryStatus.CANCELED) {
      throw new BadRequestException(
        'Cannot assign courier to a canceled delivery',
      );
    }
    if (delivery.status === DeliveryStatus.DELIVERED) {
      throw new BadRequestException(
        'Cannot assign courier to a delivered delivery',
      );
    }
    if (delivery.status === DeliveryStatus.PENDING) {
      throw new BadRequestException(
        'Delivery must be confirmed before assignment',
      );
    }

    delivery.courierId = courierId;
    delivery.status = DeliveryStatus.ASSIGNED;

    return this.deliveryRepo.save(delivery);
  }

  /**
   * ADMIN - Mettre à jour le statut
   * Règles simples de transition (tu peux durcir plus tard)
   */
  async adminUpdateStatus(
    deliveryId: string,
    nextStatus: DeliveryStatus,
  ): Promise<DeliveryEntity> {
    const delivery = await this.findOneOrFail(deliveryId);

    if (delivery.status === DeliveryStatus.CANCELED) {
      throw new BadRequestException(
        'Cannot change status of a canceled delivery',
      );
    }
    if (delivery.status === DeliveryStatus.DELIVERED) {
      throw new BadRequestException(
        'Cannot change status of a delivered delivery',
      );
    }

    // Règles minimales
    if (nextStatus === DeliveryStatus.CONFIRMED && !delivery.paid) {
      throw new BadRequestException('Cannot confirm: delivery not paid');
    }
    if (nextStatus === DeliveryStatus.IN_TRANSIT && !delivery.courierId) {
      throw new BadRequestException(
        'Cannot set in_transit without courier assignment',
      );
    }

    delivery.status = nextStatus;
    return this.deliveryRepo.save(delivery);
  }

  /**
   * Hook côté paiement (à appeler depuis PaymentModule via event/webhook)
   * Quand paiement OK => paid=true + CONFIRMED
   */
  async markAsPaid(deliveryId: string): Promise<DeliveryEntity> {
    const delivery = await this.findOneOrFail(deliveryId);

    if (delivery.paid) return delivery;
    if (delivery.status === DeliveryStatus.CANCELED) {
      throw new BadRequestException('Cannot pay a canceled delivery');
    }

    delivery.paid = true;
    delivery.status = DeliveryStatus.CONFIRMED;

    return this.deliveryRepo.save(delivery);
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    if (event.referenceType !== PaymentReferenceType.EXPRESS_DELIVERY) return;
    try {
      await this.markAsPaid(event.referenceId);
    } catch (err) {
      this.logger.error(`Erreur gestion paiement EXPRESS_DELIVERY ${event.referenceId}`, err);
    }
  }
}
