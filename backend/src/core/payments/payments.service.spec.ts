import { BadRequestException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

import { Payment } from './payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentProvider } from './providers/payment-provider.enum';
import { PaymentReferenceType } from './payment-reference-type.enum';
import { PaymentStatus } from './payment-status.enum';
import { OrderStatus } from 'src/shop/order/order-status.enum';

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('PaymentsService', () => {
  let paymentRepo: MockRepo<Payment>;
  let service: PaymentsService;

  const stripeProvider = {
    supports: jest.fn(),
    initPayment: jest.fn(),
    verifyPayment: jest.fn(),
  };

  const orderService = {
    findOne: jest.fn(),
    updateStatus: jest.fn(),
  };

  const invoicesService = {
    generateInvoicePdf: jest.fn(),
  };

  const notificationsService = {
    sendNotification: jest.fn(),
  };

  const cexpressService = {
    createDelivery: jest.fn(),
  };

  const deliveryService = {
    findOneOrFail: jest.fn(),
    markAsPaid: jest.fn(),
  };

  const importExportService = {
    findOneForUserOrFail: jest.fn(),
  };

  const cleanBookingsService = {
    findOne: jest.fn(),
    markPaid: jest.fn(),
  };

  const todoOrderService = {
    findOne: jest.fn(),
    markPaid: jest.fn(),
  };

  const grillOrdersService = {
    findOne: jest.fn(),
    markAsPaid: jest.fn(),
    attachExpressDelivery: jest.fn(),
  };

  beforeEach(() => {
    paymentRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
    };

    stripeProvider.initPayment.mockReset();
    stripeProvider.verifyPayment.mockReset();

    orderService.findOne.mockReset();
    orderService.updateStatus.mockReset();
    invoicesService.generateInvoicePdf.mockReset();
    notificationsService.sendNotification.mockReset();
    cexpressService.createDelivery.mockReset();
    deliveryService.findOneOrFail.mockReset();
    deliveryService.markAsPaid.mockReset();
    importExportService.findOneForUserOrFail.mockReset();
    cleanBookingsService.findOne.mockReset();
    cleanBookingsService.markPaid.mockReset();
    todoOrderService.findOne.mockReset();
    todoOrderService.markPaid.mockReset();
    grillOrdersService.findOne.mockReset();
    grillOrdersService.markAsPaid.mockReset();
    grillOrdersService.attachExpressDelivery.mockReset();

    service = new PaymentsService(
      paymentRepo as unknown as Repository<Payment>,
      {} as never,
      cleanBookingsService as never,
      todoOrderService as never,
      grillOrdersService as never,
      stripeProvider as never,
      {} as never,
      {} as never,
      {} as never,
      {} as never,
      orderService as never,
      invoicesService as never,
      notificationsService as never,
      cexpressService as never,
      deliveryService as never,
      importExportService as never,
    );
  });

  it('initPayment should persist payment and return provider init data', async () => {
    orderService.findOne.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      totalAmount: 10000,
      deliveryFee: 500,
      isPaid: false,
    });

    paymentRepo.create!.mockImplementation((value: Partial<Payment>) => ({
      id: 'payment-1',
      status: PaymentStatus.PENDING,
      currency: 'XAF',
      ...value,
    }));
    paymentRepo.save!.mockImplementation(async (value: Payment) => value);

    stripeProvider.initPayment.mockResolvedValue({
      provider: PaymentProvider.STRIPE,
      providerTransactionId: 'txn-123',
      redirectUrl: 'https://pay.example/redirect',
    });

    const result = await service.initPayment({
      userId: 'user-1',
      provider: PaymentProvider.STRIPE,
      referenceType: PaymentReferenceType.SHOP_ORDER,
      referenceId: 'order-1',
      currency: 'XAF',
    });

    expect(result).toEqual({
      paymentId: 'payment-1',
      providerTransactionId: 'txn-123',
      provider: PaymentProvider.STRIPE,
      amount: 10500,
      currency: 'XAF',
      redirectUrl: 'https://pay.example/redirect',
      instructions: null,
    });
    expect(stripeProvider.initPayment).toHaveBeenCalledWith(
      expect.objectContaining({
        orderId: 'order-1',
        amount: 10500,
      }),
    );
  });

  it('verify should mark payment success and trigger order side effects', async () => {
    const payment = {
      id: 'payment-1',
      provider: PaymentProvider.STRIPE,
      providerTransactionId: 'txn-1',
      status: PaymentStatus.PENDING,
      referenceType: PaymentReferenceType.SHOP_ORDER,
      referenceId: 'order-1',
      user: { id: 'user-1' },
    } as Payment;

    paymentRepo.findOne!.mockResolvedValue(payment);
    paymentRepo.save!.mockImplementation(async (value: Payment) => value);
    stripeProvider.verifyPayment.mockResolvedValue('SUCCESS');
    orderService.findOne.mockResolvedValue({
      id: 'order-1',
      userId: 'user-1',
      deliveryOption: 'other',
      deliveryAddress: null,
    });
    invoicesService.generateInvoicePdf.mockResolvedValue({
      fileName: 'invoice.pdf',
    });
    notificationsService.sendNotification.mockResolvedValue(undefined);

    const result = await service.verify('txn-1');

    expect(result.status).toBe(PaymentStatus.SUCCESS);
    expect(orderService.updateStatus).toHaveBeenCalledWith(
      'order-1',
      OrderStatus.PAID,
    );
    expect(invoicesService.generateInvoicePdf).toHaveBeenCalled();
  });

  it('handleWebhook should reject unsigned webhook when raw body is provided', async () => {
    await expect(
      service.handleWebhook(
        PaymentProvider.STRIPE,
        { providerTransactionId: 'txn-1' },
        {},
        Buffer.from('payload'),
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });
});
