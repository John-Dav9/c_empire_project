// src/sectors/c-todo/services/todo-stats.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoOrder } from '../entities/todo-order.entity';
import { TodoOrderStatus } from '../enums/todo-order-status.enum';

@Injectable()
export class TodoStatsService {
  constructor(
    @InjectRepository(TodoOrder) private readonly repo: Repository<TodoOrder>,
  ) {}

  async summary() {
    const total = await this.repo.count();

    const byStatusRaw = await this.repo
      .createQueryBuilder('o')
      .select('o.status', 'status')
      .addSelect('COUNT(*)', 'count')
      .groupBy('o.status')
      .getRawMany();

    const byStatus = Object.values(TodoOrderStatus).reduce(
      (acc, st) => {
        acc[st] = 0;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const row of byStatusRaw) byStatus[row.status] = Number(row.count);

    // CA simple: somme amount des commandes confirmées/terminées (adaptable)
    const revenueRow = await this.repo
      .createQueryBuilder('o')
      .select('COALESCE(SUM(o.amount), 0)', 'sum')
      .where('o.status IN (:...st)', {
        st: [TodoOrderStatus.CONFIRMED, TodoOrderStatus.COMPLETED],
      })
      .getRawOne();

    return {
      totalOrders: total,
      byStatus,
      revenue: Number(revenueRow?.sum ?? 0),
      currency: 'XAF',
    };
  }
}
