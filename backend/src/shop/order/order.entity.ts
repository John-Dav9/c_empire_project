import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToMany,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { OrderStatus } from './order-status.enum';
import { OrderItem } from './order-item.entity';

export enum DeliveryOption {
  CEXPRESS = 'cexpress',
  OTHER = 'other',
}

@Entity('orders')
export class Order {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  userId: string;

  @OneToMany(() => OrderItem, (item) => item.order, {
    cascade: true,
    eager: true,
  })
  items: OrderItem[];

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({ nullable: true })
  promoCode?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  promoDiscount: number;

  @Column({
    type: 'enum',
    enum: OrderStatus,
    default: OrderStatus.PENDING,
  })
  status: OrderStatus;

  @Column({ nullable: true })
  paymentMethod?: string;

  @Column({ type: 'enum', enum: DeliveryOption, default: DeliveryOption.OTHER })
  deliveryOption: DeliveryOption;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  deliveryFee: number;

  @Column({ nullable: true })
  deliveryAddress?: string;

  @Column({ default: false })
  isPaid: boolean;

  // Optionnel (statut livraison)
  @Column({ default: 'pending' })
  deliveryStatus:
    | 'pending'
    | 'quoted'
    | 'assigned'
    | 'picked'
    | 'delivered'
    | 'cancelled';

  @Column({ nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
