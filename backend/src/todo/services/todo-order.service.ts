// src/todo/services/todo-order.service.ts
import {
  Injectable,
  BadRequestException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { CreateTodoOrderDto } from '../dto/create-todo-order.dto';
import { TodoOrder } from '../entities/todo-order.entity';
import { TodoOrderStatus } from '../enums/todo-order-status.enum';
import { TodoService } from '../entities/todo-service.entity';
import { PaymentSuccessEvent } from 'src/core/payments/events/payment-success.event';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';

@Injectable()
export class TodoOrderService {
  private readonly logger = new Logger(TodoOrderService.name);

  constructor(
    @InjectRepository(TodoOrder)
    private readonly orderRepo: Repository<TodoOrder>,

    @InjectRepository(TodoService)
    private readonly todoServiceRepo: Repository<TodoService>,
  ) {}

  async create(dto: CreateTodoOrderDto, userId?: string) {
    const service = await this.todoServiceRepo.findOne({
      where: { id: dto.todoServiceId },
    });
    if (!service || !service.isActive)
      throw new NotFoundException('Todo service not found or inactive');

    const amount = Number(service.basePrice);
    if (!amount || amount <= 0)
      throw new BadRequestException('Invalid service price');

    const order = this.orderRepo.create({
      ...dto,
      userId,
      serviceTitle: dto.serviceTitle ?? service.title,
      amount,
      currency: 'XAF',
      status: TodoOrderStatus.PENDING,
    });

    return this.orderRepo.save(order);
  }

  findAll() {
    return this.orderRepo.find({ order: { createdAt: 'DESC' } });
  }

  findByUser(userId: string) {
    return this.orderRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  findMissions() {
    return this.orderRepo.find({
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const order = await this.orderRepo.findOne({ where: { id } });
    if (!order) throw new NotFoundException('Todo order not found');
    return order;
  }

  async updateStatus(id: string, status: TodoOrderStatus) {
    const order = await this.findOne(id);
    order.status = status;
    return this.orderRepo.save(order);
  }

  async markPaid(orderId: string) {
    const order = await this.findOne(orderId);
    if (order.status !== TodoOrderStatus.PENDING) return order;

    order.status = TodoOrderStatus.CONFIRMED;
    return this.orderRepo.save(order);
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    if (event.referenceType !== PaymentReferenceType.TODO_TASK) return;
    try {
      await this.markPaid(event.referenceId);
    } catch (err) {
      this.logger.error(`Erreur gestion paiement TODO_TASK ${event.referenceId}`, err);
    }
  }
}
