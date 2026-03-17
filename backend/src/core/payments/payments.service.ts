import {
  Injectable,
  NotFoundException,
  BadRequestException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

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

import { OrderService } from 'src/shop/order/order.service';
import { OrderStatus } from 'src/shop/order/order-status.enum';
import { DeliveryOption } from 'src/shop/order/order.entity';

import { PaymentReferenceType } from './payment-reference-type.enum';
import { CexpressService } from 'src/express/express.service';
import { DeliveryService } from 'src/express/services/delivery.service';
import { ImportExportService } from 'src/express/services/import-export.service';

import { EventBooking } from 'src/events/entities/event-booking.entity';
import { EventBookingStatus } from 'src/events/enums/event-booking-status.enum';

import { CleanBookingsService } from 'src/clean/services/clean-bookings.service';
import { CleanBookingStatus } from 'src/clean/enums/clean-booking-status.enum';

import { TodoOrderService } from 'src/todo/services/todo-order.service';
import { TodoOrderStatus } from 'src/todo/enums/todo-order-status.enum';

import { GrillOrdersService } from 'src/grill/services/grill-orders.service';
import { GrillOrderStatus } from 'src/grill/enums/grill-order-status.enum';
import { GrillDeliveryMode } from 'src/grill/enums/grill-delivery-mode.enum';
import { User } from 'src/auth/entities/user.entity';

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

    @InjectRepository(EventBooking)
    private readonly eventBookingRepo: Repository<EventBooking>,

    private readonly cleanBookingsService: CleanBookingsService,
    private readonly todoOrderService: TodoOrderService,
    private readonly grillOrdersService: GrillOrdersService,

    private readonly stripeProvider: StripeProvider,
    private readonly paypalProvider: PaypalProvider,
    private readonly walletProvider: WalletProvider,
    private readonly mobileMoneyProvider: MobileMoneyProvider,
    private readonly cardPaymentProvider: CardPaymentProvider,

    private readonly orderService: OrderService,
    private readonly invoicesService: InvoicesService,
    private readonly notificationsService: NotificationsService,

    private readonly cexpressService: CexpressService,

    private readonly deliveryService: DeliveryService,
    private readonly importExportService: ImportExportService,
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
        const order = await this.orderService.findOne(payload.referenceId);

        if (payload.userId && order.userId !== payload.userId) {
          throw new BadRequestException('You can only pay your own order');
        }
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
        const delivery = await this.deliveryService.findOneOrFail(
          payload.referenceId,
        );

        if (payload.userId && delivery.userId !== payload.userId) {
          throw new BadRequestException('You can only pay your own delivery');
        }
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
        const req = await this.importExportService.findOneForUserOrFail(
          payload.userId,
          payload.referenceId,
        );

        if (!req.finalPrice || req.finalPrice <= 0) {
          throw new BadRequestException(
            'No final price available yet for this import/export request',
          );
        }

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

        if (payload.userId && ownerUserId && ownerUserId !== payload.userId) {
          throw new BadRequestException('You can only pay your own booking');
        }

        if (booking.status === EventBookingStatus.PAID) {
          throw new BadRequestException('Booking already paid');
        }

        return {
          amount: Number(booking.totalAmount),
          ownerUserId,
          metadata: { bookingId: booking.id, eventId: booking.event?.id },
        };
      }

      case PaymentReferenceType.CLEAN_BOOKING: {
        const booking = await this.cleanBookingsService.findOne(
          payload.referenceId,
        );

        if (payload.userId && booking.user?.id !== payload.userId) {
          throw new BadRequestException('You can only pay your own booking');
        }

        if (booking.status === CleanBookingStatus.CONFIRMED) {
          throw new BadRequestException('Booking already paid');
        }

        return {
          amount: Number(booking.amount),
          ownerUserId: booking.user?.id,
          metadata: { cleanBookingId: booking.id },
        };
      }

      case PaymentReferenceType.TODO_TASK: {
        const order = await this.todoOrderService.findOne(payload.referenceId);

        if (order.status !== TodoOrderStatus.PENDING) {
          throw new BadRequestException(
            'Todo task already paid or not payable',
          );
        }

        if (!order.amount || Number(order.amount) <= 0) {
          throw new BadRequestException('Todo task amount invalid');
        }

        return {
          amount: Number(order.amount),
          metadata: { todoOrderId: order.id },
        };
      }

      case PaymentReferenceType.GRILLFOOD_ORDER: {
        const order = await this.grillOrdersService.findOne(
          payload.referenceId,
        );

        if (order.status !== GrillOrderStatus.PENDING) {
          throw new BadRequestException(
            'Grill order already paid or not payable',
          );
        }

        if (!order.total || Number(order.total) <= 0) {
          throw new BadRequestException('Grill order total invalid');
        }

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

  private async onPaymentSuccess(payment: Payment) {
    switch (payment.referenceType) {
      case PaymentReferenceType.SHOP_ORDER: {
        await this.orderService.updateStatus(
          payment.referenceId,
          OrderStatus.PAID,
        );
        const order = await this.orderService.findOne(payment.referenceId);

        const invoice = await this.invoicesService.generateInvoicePdf(
          order,
          payment,
        );

        await this.notificationsService.sendNotification({
          userId: order.userId,
          channel: 'IN_APP',
          title: 'Paiement confirmé',
          message: `Votre commande ${order.id} a été payée. Facture: ${invoice.fileName}`,
        });

        if (
          order.deliveryOption === DeliveryOption.CEXPRESS &&
          order.deliveryAddress
        ) {
          const delivery = await this.cexpressService.createDelivery({
            orderId: order.id,
            dropoff: order.deliveryAddress,
            amountToCollect: 0,
          });
          console.log('[CEXPRESS DELIVERY CREATED]', delivery);
        }

        return;
      }

      case PaymentReferenceType.EXPRESS_DELIVERY: {
        await this.deliveryService.markAsPaid(payment.referenceId);

        await this.notificationsService.sendNotification({
          userId: payment.user?.id,
          channel: 'IN_APP',
          title: 'Paiement confirmé',
          message: `Votre livraison C'EXPRESS ${payment.referenceId} est payée ✅`,
        });

        return;
      }

      case PaymentReferenceType.EXPRESS_IMPORT_EXPORT: {
        await this.notificationsService.sendNotification({
          userId: payment.user?.id,
          channel: 'IN_APP',
          title: 'Paiement confirmé',
          message: `Votre devis Import/Export ${payment.referenceId} a été payé ✅`,
        });
        return;
      }

      case PaymentReferenceType.EVENT_BOOKING: {
        const booking = await this.eventBookingRepo.findOne({
          where: { id: payment.referenceId },
        });
        if (!booking) return;

        booking.status = EventBookingStatus.PAID;
        await this.eventBookingRepo.save(booking);

        await this.notificationsService.sendNotification({
          userId: payment.user?.id,
          channel: 'IN_APP',
          title: 'Paiement confirmé',
          message: `Votre réservation C'EVENT ${booking.id} est payée ✅`,
        });

        return;
      }

      case PaymentReferenceType.CLEAN_BOOKING: {
        await this.cleanBookingsService.markPaid(
          payment.referenceId,
          payment.id,
          payment.provider,
        );

        await this.notificationsService.sendNotification({
          userId: payment.user?.id,
          channel: 'IN_APP',
          title: 'Paiement confirmé',
          message: `Votre réservation C'CLEAN ${payment.referenceId} est payée ✅`,
        });

        return;
      }

      case PaymentReferenceType.TODO_TASK: {
        await this.todoOrderService.markPaid(payment.referenceId);

        await this.notificationsService.sendNotification({
          userId: payment.user?.id,
          channel: 'IN_APP',
          title: 'Paiement confirmé',
          message: `Votre tâche C'TODO ${payment.referenceId} est payée ✅`,
        });

        return;
      }

      case PaymentReferenceType.GRILLFOOD_ORDER: {
        await this.grillOrdersService.markAsPaid(
          payment.referenceId,
          payment.id,
        );

        const order = await this.grillOrdersService.findOne(
          payment.referenceId,
        );

        await this.notificationsService.sendNotification({
          userId: payment.user?.id,
          channel: 'IN_APP',
          title: 'Paiement confirmé',
          message: `Votre commande C'GRILL ${order.id} est payée ✅`,
        });

        if (
          order.deliveryMode === GrillDeliveryMode.DELIVERY &&
          order.address
        ) {
          const delivery = await this.cexpressService.createDelivery({
            orderId: order.id,
            dropoff: order.address,
            amountToCollect: 0,
          });

          await this.grillOrdersService.attachExpressDelivery(
            order.id,
            delivery.deliveryId,
          );
          console.log('[CEXPRESS DELIVERY CREATED FOR GRILL]', delivery);
        }

        return;
      }

      default:
        return;
    }
  }
}
