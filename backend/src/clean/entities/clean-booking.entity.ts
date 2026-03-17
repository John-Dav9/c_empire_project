import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CleanBookingStatus } from '../enums/clean-booking-status.enum';
import { User } from 'src/auth/entities/user.entity';

@Entity('clean_bookings')
export class CleanBooking {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user: User;

  // Client (MVP). Plus tard: relation user
  @Column({ length: 120 })
  fullName: string;

  @Column({ length: 120 })
  email: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  // Prestation
  @Column()
  cleanServiceId: string; // id de CleanServiceEntity

  @Column({ length: 120 })
  serviceTitle: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  amount: number;

  @Column({ length: 8, default: 'EUR' })
  currency: string;

  // Adresse + planning
  @Column({ length: 200 })
  address: string;

  @Column({ nullable: true })
  city?: string;

  @Column()
  scheduledAt: string; // ISO string (MVP)

  // Statut
  @Column({
    type: 'enum',
    enum: CleanBookingStatus,
    default: CleanBookingStatus.DRAFT,
  })
  status: CleanBookingStatus;

  // Paiement global
  @Column({ nullable: true })
  paymentId?: string; // id Payment global (UUID)

  @Column({ nullable: true })
  paymentProvider?: string; // MOBILE_MONEY, STRIPE, PAYPAL, WALLET...

  @Column({ nullable: true })
  paidAt?: string; // ISO string

  // Assignation (MVP: text). Plus tard: relation staff/agent
  @Column({ nullable: true })
  assignedTo?: string;

  @Column({ type: 'text', nullable: true })
  notes?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
