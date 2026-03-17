import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { PaymentStatus } from './payment-status.enum';
import { User } from 'src/auth/entities/user.entity';
import { PaymentProvider } from './providers/payment-provider.enum';
import { PaymentReferenceType } from './payment-reference-type.enum';

@Entity('payments')
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column()
  amount: number;

  @Column()
  currency: string;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider: PaymentProvider;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status: PaymentStatus;

  @Column({ nullable: true })
  providerTransactionId?: string;

  @Column({ type: 'enum', enum: PaymentReferenceType })
  referenceType: PaymentReferenceType;

  @Column()
  referenceId: string;

  @Column({ nullable: true })
  orderId?: string;

  @CreateDateColumn()
  createdAt: Date;
}
