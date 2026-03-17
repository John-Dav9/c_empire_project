import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CleanReviewStatus } from '../enums/clean-review-status.enum';

@Entity('clean_reviews')
export class CleanReview {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  bookingId: string; // CleanBooking.id

  @Column({ nullable: true })
  cleanServiceId?: string;

  @Column({ length: 120 })
  fullName: string;

  @Column({ length: 120 })
  email: string;

  @Column({ type: 'int' })
  rating: number; // 1..5

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @Column({
    type: 'enum',
    enum: CleanReviewStatus,
    default: CleanReviewStatus.PENDING,
  })
  status: CleanReviewStatus;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
