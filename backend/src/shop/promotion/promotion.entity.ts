import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  Index,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { PromotionType } from './promotion-type.enum';
import { Product } from '../product/product.entity';
import { User } from '../../auth/entities/user.entity';

@Entity('promotions')
@Index(['isActive'])
export class Promotion {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string;

  @Column({ length: 60, unique: true, nullable: true })
  code?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: PromotionType })
  type: PromotionType;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  value: number; // percent: 20 | fixed: 5000

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  startsAt?: Date;

  @Column({ type: 'timestamp', nullable: true })
  endsAt?: Date;

  @ManyToMany(() => Product)
  @JoinTable({ name: 'promotion_products' })
  products: Product[];

  @ManyToOne(() => User, { nullable: true })
  createdBy?: User;

  @Column({ nullable: true })
  createdById?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
