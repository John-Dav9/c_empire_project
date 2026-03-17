import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('grill_products')
export class GrillProduct {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ length: 8, default: 'XAF' })
  currency: string;

  @Column({ length: 80, nullable: true })
  category?: string; // poisson, porc, poulet, menu...

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'int', nullable: true })
  stockQty?: number;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  promoPrice?: number;

  @Column({ default: false })
  isFeatured: boolean;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'int', nullable: true })
  prepTimeMin?: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
