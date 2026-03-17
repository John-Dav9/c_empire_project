import { BadRequestException } from '@nestjs/common';
import { ObjectLiteral, Repository } from 'typeorm';

import { OrderService } from './order.service';
import { Order, DeliveryOption } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { OrderStatus } from './order-status.enum';

type MockRepo<T extends ObjectLiteral> = Partial<
  Record<keyof Repository<T>, jest.Mock>
>;

describe('OrderService', () => {
  let orderRepo: MockRepo<Order>;
  let itemRepo: MockRepo<OrderItem>;
  let cartRepo: MockRepo<Cart>;
  let cartItemRepo: MockRepo<Cart>;

  const cexpressService = {
    quoteDelivery: jest.fn(),
  };
  const promotionService = {
    findActiveByCode: jest.fn(),
  };
  const productService = {
    getCheckoutSnapshot: jest.fn(),
  };

  let service: OrderService;

  beforeEach(() => {
    orderRepo = {
      create: jest.fn(),
      save: jest.fn(),
      findOne: jest.fn(),
      find: jest.fn(),
    };
    itemRepo = {
      create: jest.fn(),
    };
    cartRepo = {
      findOne: jest.fn(),
      save: jest.fn(),
    };
    cartItemRepo = {
      remove: jest.fn(),
    };

    cexpressService.quoteDelivery.mockReset();
    promotionService.findActiveByCode.mockReset();
    productService.getCheckoutSnapshot.mockReset();

    service = new OrderService(
      orderRepo as unknown as Repository<Order>,
      itemRepo as unknown as Repository<OrderItem>,
      cartRepo as unknown as Repository<Cart>,
      cartItemRepo as unknown as Repository<any>,
      cexpressService as never,
      promotionService as never,
      productService as never,
    );
  });

  it('checkout should reject when cart is empty', async () => {
    cartRepo.findOne!.mockResolvedValue({ items: [] });

    await expect(service.checkout('user-1', {})).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('checkout should include cexpress delivery fee in created order', async () => {
    const cart = {
      userId: 'user-1',
      isActive: true,
      totalAmount: 10000,
      items: [
        {
          productId: 'product-1',
          productName: 'Coffee',
          unitPrice: 10000,
          quantity: 1,
        },
      ],
    };

    cartRepo.findOne!.mockResolvedValue(cart);
    cexpressService.quoteDelivery.mockResolvedValue({ fee: 1500 });
    productService.getCheckoutSnapshot.mockResolvedValue({
      id: 'product-1',
      name: 'Coffee',
      unitPrice: 10000,
      stock: 10,
      isActive: true,
    });
    itemRepo.create!.mockImplementation((value: Partial<OrderItem>) => value);
    orderRepo.create!.mockImplementation((value: Partial<Order>) => value);
    orderRepo.save!.mockImplementation(async (value: Order) => value);
    cartRepo.save!.mockResolvedValue(undefined);
    cartItemRepo.remove!.mockResolvedValue(undefined);

    const result = await service.checkout('user-1', {
      deliveryOption: DeliveryOption.CEXPRESS,
      deliveryAddress: 'Douala',
    });

    expect(cexpressService.quoteDelivery).toHaveBeenCalled();
    expect(result.deliveryFee).toBe(1500);
    expect(result.totalAmount).toBe(10000);
    expect(cart.isActive).toBe(false);
  });

  it('updateStatus should set isPaid on paid status', async () => {
    const order = {
      id: 'order-1',
      status: OrderStatus.PENDING,
      isPaid: false,
    } as Order;

    orderRepo.findOne!.mockResolvedValue(order);
    orderRepo.save!.mockImplementation(async (value: Order) => value);

    const result = await service.updateStatus('order-1', OrderStatus.PAID);

    expect(result.isPaid).toBe(true);
    expect(orderRepo.save).toHaveBeenCalledWith(
      expect.objectContaining({ status: OrderStatus.PAID, isPaid: true }),
    );
  });
});
