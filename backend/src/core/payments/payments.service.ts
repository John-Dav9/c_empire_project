import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EventEmitter2 } from '@nestjs/event-emitter';

import { Payment } from './payment.entity';
import { PaymentStatus } from './payment-status.enum';
import { PaymentProvider } from './providers/payment-provider.enum';
import {
  IPaymentProvider,
  InitPaymentParams,
} from './providers/payment-provider.interface';

import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { CardPaymentProvider } from './providers/card.provider';
import { WalletProvider } from './providers/wallet.provider';
import { PaypalProvider } from './providers/paypal.provider';
import { StripeProvider } from './providers/stripe.provider';

import { InvoicesService } from 'src/core/invoices/invoices.service';
import { NotificationsService } from 'src/core/notifications/notifications.service';
import { WebhookVerifier } from './webhooks/webhook-verifier';
import { PaymentReferenceType } from './payment-reference-type.enum';
import { PaymentSuccessEvent } from './events/payment-success.event';
import { User } from 'src/auth/entities/user.entity';

// Entity imports (directs, sans importer les modules)
import { Order } from 'src/shop/order/order.entity';
import { EventBooking } from 'src/events/entities/event-booking.entity';
import { EventBookingStatus } from 'src/events/enums/event-booking-status.enum';
import { CleanBooking } from 'src/clean/entities/clean-booking.entity';
import { CleanBookingStatus } from 'src/clean/enums/clean-booking-status.enum';
import { TodoOrder } from 'src/todo/entities/todo-order.entity';
import { TodoOrderStatus } from 'src/todo/enums/todo-order-status.enum';
import { GrillOrder } from 'src/grill/entities/grill-order.entity';
import { GrillOrderStatus } from 'src/grill/enums/grill-order-status.enum';
import { DeliveryEntity } from 'src/express/entities/delivery.entity';
import { ImportExportEntity } from 'src/express/entities/import-export.entity';

type PaymentMetadata = Record<string, unknown>;

type PaymentInitPayload = {
  userId?: string;
  referenceType: PaymentReferenceType;
  referenceId: string;
  currency?: string;
  provider: PaymentProvider;
  metadata?: PaymentMetadata;
};

type PaymentWebhookPayload = Record<string, unknown> & {
  providerTransactionId?: string;
  transactionId?: string;
  referenceId?: string;
};

type PaymentWebhookHeaders = Record<string, string | string[] | undefined>;

@Injectable()
export class PaymentsService {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepo: Repository<Payment>,

    // Repositories directs (plus de forwardRef circulaires)
    @InjectRepository(Order)
    private readonly orderRepo: Repository<Order>,
    @InjectRepository(EventBooking)
    private readonly eventBookingRepo: Repository<EventBooking>,
    @InjectRepository(CleanBooking)
    private readonly cleanBookingRepo: Repository<CleanBooking>,
    @InjectRepository(TodoOrder)
    private readonly todoOrderRepo: Repository<TodoOrder>,
    @InjectRepository(GrillOrder)
    private readonly grillOrderRepo: Repository<GrillOrder>,
    @InjectRepository(DeliveryEntity)
    private readonly deliveryRepo: Repository<DeliveryEntity>,
    @InjectRepository(ImportExportEntity)
    private readonly importExportRepo: Repository<ImportExportEntity>,

    // Providers de paiement
    private readonly stripeProvider: StripeProvider,
    private readonly paypalProvider: PaypalProvider,
    private readonly walletProvider: WalletProvider,
    private readonly mobileMoneyProvider: MobileMoneyProvider,
    private readonly cardPaymentProvider: CardPaymentProvider,

    // Services non-circulaires
    private readonly invoicesService: InvoicesService,
    private readonly notificationsService: NotificationsService,

    // EventEmitter pour découpler les modules métier
    private readonly eventEmitter: EventEmitter2,
  ) {}

  private getProvider(provider: PaymentProvider): IPaymentProvider {
    switch (provider) {
      case PaymentProvider.ORANGE_MONEY:
      case PaymentProvider.MTN_MOMO:
      case PaymentProvider.WAVE:
        return this.mobileMoneyProvider;
      case PaymentProvider.CARD:
        return this.cardPaymentProvider;
      case PaymentProvider.STRIPE:
        return this.stripeProvider;
      case PaymentProvider.PAYPAL:
        return this.paypalProvider;
      case PaymentProvider.WALLET:
        return this.walletProvider;
      default:
        throw new NotFoundException(
          `Payment provider not supported: ${provider}`,
        );
    }
  }

  private ensureMockPaymentsAllowed(provider: PaymentProvider) {
    const mockProviders = new Set<PaymentProvider>([
      PaymentProvider.CARD,
      PaymentProvider.PAYPAL,
      PaymentProvider.WALLET,
    ]);
    if (
      mockProviders.has(provider) &&
      process.env.ALLOW_MOCK_PAYMENTS !== 'true'
    ) {
      throw new BadRequestException(
        `Le provider ${provider} est désactivé hors mode mock.`,
      );
    }
  }

  async findById(id: string): Promise<Payment> {
    const payment = await this.paymentRepo.findOne({
      where: { id },
      relations: ['user'],
    });
    if (!payment) throw new NotFoundException('Payment not found');
    return payment;
  }

  async createPaymentIntent(payload: PaymentInitPayload) {
    return this.initPayment(payload);
  }

  async initPayment(payload: PaymentInitPayload) {
    if (!payload.provider)
      throw new BadRequestException('provider is required');
    if (!payload.referenceType)
      throw new BadRequestException('referenceType is required');
    if (!payload.referenceId)
      throw new BadRequestException('referenceId is required');

    const resolved = await this.resolvePayable(payload);
    this.ensureMockPaymentsAllowed(payload.provider);

    if (
      payload.userId &&
      resolved.ownerUserId &&
      resolved.ownerUserId !== payload.userId
    ) {
      throw new BadRequestException('You can only pay your own resource');
    }

    const providerImpl = this.getProvider(payload.provider);
    const userRef = payload.userId
      ? ({ id: payload.userId } as User)
      : undefined;

    const payment = this.paymentRepo.create({
      amount: resolved.amount,
      currency: payload.currency ?? 'XAF',
      provider: payload.provider,
      user: userRef,
      referenceType: payload.referenceType,
      referenceId: payload.referenceId,
      status: PaymentStatus.PENDING,
      orderId:
        payload.referenceType === PaymentReferenceType.SHOP_ORDER
          ? payload.referenceId
          : undefined,
    });

    await this.paymentRepo.save(payment);

    const initParams: InitPaymentParams = {
      userId: payload.userId,
      orderId: payload.referenceId,
      amount: resolved.amount,
      currency: payment.currency,
      provider: payload.provider,
      metadata: { ...payload.metadata, ...(resolved.metadata ?? {}) },
    };

    let result;
    try {
      result = await providerImpl.initPayment(initParams);
    } catch (error) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);
      throw error;
    }

    if (!result?.providerTransactionId) {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);
      throw new InternalServerErrorException(
        'Payment provider response missing transaction reference',
      );
    }

    payment.providerTransactionId = result.providerTransactionId;
    await this.paymentRepo.save(payment);

    return {
      paymentId: payment.id,
      providerTransactionId: payment.providerTransactionId,
      provider: payment.provider,
      amount: payment.amount,
      currency: payment.currency,
      redirectUrl: result.redirectUrl ?? null,
      instructions: result.instructions ?? null,
    };
  }

  async verify(providerTransactionId: string) {
    const payment = await this.paymentRepo.findOne({
      where: { providerTransactionId },
    });
    if (!payment) throw new NotFoundException('Payment not found');

    if (payment.status === PaymentStatus.SUCCESS) return payment;

    const provider = this.getProvider(payment.provider);
    const status = await provider.verifyPayment(providerTransactionId);

    if (status === 'SUCCESS') {
      payment.status = PaymentStatus.SUCCESS;
      await this.paymentRepo.save(payment);
      await this.onPaymentSuccess(payment);
      return payment;
    }

    if (status === 'FAILED') {
      payment.status = PaymentStatus.FAILED;
      await this.paymentRepo.save(payment);
      return payment;
    }

    payment.status = PaymentStatus.PENDING;
    await this.paymentRepo.save(payment);
    return payment;
  }

  async handleWebhook(
    provider: string,
    payload: PaymentWebhookPayload,
    headers: PaymentWebhookHeaders,
    rawBody?: Buffer,
  ) {
    const providerKey = provider as PaymentProvider;
    const strictMode = process.env.PAYMENT_WEBHOOK_STRICT === 'true';
    const shouldVerifySignature =
      rawBody && (strictMode || WebhookVerifier.hasSecret(providerKey));

    if (shouldVerifySignature) {
      const ok = WebhookVerifier.verify(providerKey, rawBody, headers);
      if (!ok) throw new BadRequestException('Invalid webhook signature');
    }

    const providerTransactionId =
      payload.providerTransactionId ||
      payload.transactionId ||
      payload.referenceId;

    if (!providerTransactionId)
      throw new BadRequestException('Missing providerTransactionId');

    return this.verify(providerTransactionId);
  }

  // ==============================
  // RESOLVE PAYABLE (repos directs)
  // ==============================
  private async resolvePayable(payload: {
    userId?: string;
    referenceType: PaymentReferenceType;
    referenceId: string;
  }): Promise<{
    amount: number;
    ownerUserId?: string;
    metadata?: PaymentMetadata;
  }> {
    switch (payload.referenceType) {
      case PaymentReferenceType.SHOP_ORDER: {
        const order = await this.orderRepo.findOne({
          where: { id: payload.referenceId },
        });
        if (!order) throw new NotFoundException('Shop order not found');
        if (payload.userId && order.userId !== payload.userId)
          throw new BadRequestException('You can only pay your own order');
        if (order.isPaid) throw new BadRequestException('Order already paid');
        const payable =
          Number(order.totalAmount) + Number(order.deliveryFee || 0);
        return {
          amount: payable,
          ownerUserId: order.userId,
          metadata: { orderId: order.id },
        };
      }

      case PaymentReferenceType.EXPRESS_DELIVERY: {
        const delivery = await this.deliveryRepo.findOne({
          where: { id: payload.referenceId },
        });
        if (!delivery) throw new NotFoundException('Delivery not found');
        if (payload.userId && delivery.userId !== payload.userId)
          throw new BadRequestException('You can only pay your own delivery');
        if (delivery.paid)
          throw new BadRequestException('Delivery already paid');
        return {
          amount: Number(delivery.price),
          ownerUserId: delivery.userId,
          metadata: { deliveryId: delivery.id },
        };
      }

      case PaymentReferenceType.EXPRESS_IMPORT_EXPORT: {
        if (!payload.userId)
          throw new BadRequestException(
            'userId is required for import/export payments',
          );
        const req = await this.importExportRepo.findOne({
          where: { id: payload.referenceId, userId: payload.userId },
        });
        if (!req) throw new NotFoundException('Import/export request not found');
        if (!req.finalPrice || req.finalPrice <= 0)
          throw new BadRequestException(
            'No final price available yet for this import/export request',
          );
        return {
          amount: Number(req.finalPrice),
          ownerUserId: req.userId,
          metadata: { importExportId: req.id },
        };
      }

      case PaymentReferenceType.EVENT_BOOKING: {
        const booking = await this.eventBookingRepo.findOne({
          where: { id: payload.referenceId },
          relations: ['user', 'event'],
        });
        if (!booking) throw new NotFoundException('Event booking not found');
        const ownerUserId = booking.user?.id;
        if (payload.userId && ownerUserId && ownerUserId !== payload.userId)
          throw new BadRequestException('You can only pay your own booking');
        if (booking.status === EventBookingStatus.PAID)
          throw new BadRequestException('Booking already paid');
        return {
          amount: Number(booking.totalAmount),
          ownerUserId,
          metadata: { bookingId: booking.id, eventId: booking.event?.id },
        };
      }

      case PaymentReferenceType.CLEAN_BOOKING: {
        const booking = await this.cleanBookingRepo.findOne({
          where: { id: payload.referenceId },
          relations: ['user'],
        });
        if (!booking) throw new NotFoundException('Clean booking not found');
        if (payload.userId && booking.user?.id !== payload.userId)
          throw new BadRequestException('You can only pay your own booking');
        if (booking.status === CleanBookingStatus.CONFIRMED)
          throw new BadRequestException('Booking already paid');
        return {
          amount: Number(booking.amount),
          ownerUserId: booking.user?.id,
          metadata: { cleanBookingId: booking.id },
        };
      }

      case PaymentReferenceType.TODO_TASK: {
        const order = await this.todoOrderRepo.findOne({
          where: { id: payload.referenceId },
        });
        if (!order) throw new NotFoundException('Todo order not found');
        if (order.status !== TodoOrderStatus.PENDING)
          throw new BadRequestException(
            'Todo task already paid or not payable',
          );
        if (!order.amount || Number(order.amount) <= 0)
          throw new BadRequestException('Todo task amount invalid');
        return {
          amount: Number(order.amount),
          metadata: { todoOrderId: order.id },
        };
      }

      case PaymentReferenceType.GRILLFOOD_ORDER: {
        const order = await this.grillOrderRepo.findOne({
          where: { id: payload.referenceId },
        });
        if (!order) throw new NotFoundException('Grill order not found');
        if (order.status !== GrillOrderStatus.PENDING)
          throw new BadRequestException(
            'Grill order already paid or not payable',
          );
        if (!order.total || Number(order.total) <= 0)
          throw new BadRequestException('Grill order total invalid');
        return {
          amount: Number(order.total),
          metadata: { grillOrderId: order.id },
        };
      }

      default:
        throw new BadRequestException(
          `Unsupported referenceType: ${payload.referenceType}`,
        );
    }
  }

  // ==============================
  // PAYMENT SUCCESS — via EventEmitter
  // ==============================
  private async onPaymentSuccess(payment: Payment) {
    // Émet l'événement → chaque module gère sa propre logique
    const event = new PaymentSuccessEvent(
      payment.id,
      payment.referenceType,
      payment.referenceId,
      payment.provider,
      payment.amount,
      payment.user?.id,
    );
    this.eventEmitter.emit('payment.success', event);

    // Facture PDF pour commandes C'SHOP
    if (payment.referenceType === PaymentReferenceType.SHOP_ORDER) {
      const order = await this.orderRepo.findOne({
        where: { id: payment.referenceId },
        relations: ['items'],
      });
      if (order) {
        await this.invoicesService.generateInvoicePdf(order, payment);
      }
    }

    // Notifications centralisées (NotificationsService pas circulaire)
    await this.sendSuccessNotification(payment);
  }

  private async sendSuccessNotification(payment: Payment) {
    const userId = payment.user?.id;
    if (!userId) return;

    const labels: Record<PaymentReferenceType, string> = {
      [PaymentReferenceType.SHOP_ORDER]: "C'SHOP",
      [PaymentReferenceType.EXPRESS_DELIVERY]: "C'EXPRESS livraison",
      [PaymentReferenceType.EXPRESS_IMPORT_EXPORT]: "C'EXPRESS import/export",
      [PaymentReferenceType.EVENT_BOOKING]: "C'EVENT",
      [PaymentReferenceType.CLEAN_BOOKING]: "C'CLEAN",
      [PaymentReferenceType.TODO_TASK]: "C'TODO",
      [PaymentReferenceType.GRILLFOOD_ORDER]: "C'GRILL",
    };

    const label = labels[payment.referenceType] ?? 'Service';

    await this.notificationsService.sendNotification({
      userId,
      channel: 'IN_APP',
      title: 'Paiement confirmé ✅',
      message: `Votre ${label} ${payment.referenceId} a été payé avec succès.`,
    });
  }
}
