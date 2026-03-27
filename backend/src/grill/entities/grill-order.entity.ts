import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
  Index,
} from 'typeorm';
import { GrillOrderStatus } from '../enums/grill-order-status.enum';
import { GrillDeliveryMode } from '../enums/grill-delivery-mode.enum';
import { GrillOrderItem } from './grill-order-item.entity';

@Entity('grill_orders')
export class GrillOrder {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Lien optionnel vers le compte utilisateur connecté
  @Column({ nullable: true })
  userId?: string;

  // Client (MVP)
  @Column({ length: 120 })
  fullName: string;

  @Column({ length: 120 })
  email: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  // Mode
  @Column({ type: 'enum', enum: GrillDeliveryMode })
  deliveryMode: GrillDeliveryMode;

  @Column({ length: 200, nullable: true })
  address?: string; // obligatoire si DELIVERY

  // Totaux
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  total: number;

  @Column({ length: 8, default: 'XAF' })
  currency: string;

  // Statut
  @Index()
  @Column({
    type: 'enum',
    enum: GrillOrderStatus,
    default: GrillOrderStatus.PENDING,
  })
  status: GrillOrderStatus;

  // Connexions (core payments + c'express)
  @Column({ nullable: true })
  paymentId?: string;

  @Column({ nullable: true })
  expressOrderId?: string;

  @OneToMany(() => GrillOrderItem, (item) => item.order, { cascade: true })
  items: GrillOrderItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
