import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';
import { Sector } from '../../core/sectors/entities/sector.entity';

@Entity('products')
export class Product {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 150 })
  name: string;

  @Column({ length: 180, unique: true })
  slug: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  promoPrice?: number | null;

  @Column({ length: 10, default: 'XAF' })
  currency: string;

  @Column({ type: 'int', default: 0 })
  stock: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-array', nullable: true })
  categories?: string[]; // ex: ["Electro", "Maison"]

  @Column({ type: 'simple-array', nullable: true })
  images?: string[]; // URLs des images

  @Column({ type: 'text', nullable: true })
  technicalSheetPdf?: string | null; // URL du PDF fiche technique

  @Column({ nullable: true })
  sku?: string; // code interne produit

  @ManyToOne(() => Sector, (sector) => sector.products, { nullable: true })
  sector?: Sector | null;

  @Column({ nullable: true })
  sectorId?: string | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
