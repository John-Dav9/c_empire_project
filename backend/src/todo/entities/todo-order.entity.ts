// src/sectors/c-todo/entities/todo-order.entity.ts
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';
import { TodoOrderStatus } from '../enums/todo-order-status.enum';

@Entity('todo_orders')
export class TodoOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // MVP : pas encore lié au User (comme C'CLEAN)
  @Column({ length: 120 })
  fullName: string;

  @Column({ length: 120 })
  email: string;

  @Index()
  @Column({ nullable: true })
  userId?: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  // Service
  @Column()
  todoServiceId: string;

  @Column({ length: 120 })
  serviceTitle: string;

  // Détails tâche
  @Column({ type: 'text', nullable: true })
  instructions?: string;

  @Column({ length: 200 })
  address: string;

  @Column({ type: 'timestamp' })
  scheduledAt: Date;

  // Paiement
  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount: number;

  @Column({ length: 8, default: 'XAF' })
  currency: string;

  @Index()
  @Column({
    type: 'enum',
    enum: TodoOrderStatus,
    default: TodoOrderStatus.PENDING,
  })
  status: TodoOrderStatus;

  /** ID de l'employé assigné à cette mission (stocké comme string, pas de FK stricte) */
  @Column({ type: 'varchar', nullable: true })
  assignedEmployeeId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
