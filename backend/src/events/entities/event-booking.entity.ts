import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

import { User } from 'src/auth/entities/user.entity';

import { Event } from './event.entity';
import { EventBookingStatus } from '../enums/event-booking-status.enum';
import { Payment } from 'src/core/payments/payment.entity';

@Entity('event_bookings')
export class EventBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: false })
  user: User;

  @ManyToOne(() => Event, { nullable: false })
  event: Event;

  @Column({ type: 'date' })
  eventDate: Date;

  @Column({ length: 255 })
  location: string;

  @Column({ type: 'json', nullable: true })
  options?: Record<string, unknown>;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalAmount: number;

  @Column({
    type: 'enum',
    enum: EventBookingStatus,
    default: EventBookingStatus.PENDING,
  })
  status: EventBookingStatus;

  @ManyToOne(() => Payment, { nullable: true })
  payment?: Payment;

  /** ID de l'employé assigné à cet événement (stocké comme string, pas de FK stricte) */
  @Column({ type: 'varchar', nullable: true })
  assignedEmployeeId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
