import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CleanServiceType } from '../enums/clean-service-type.enum';

@Entity('clean_services')
export class CleanServiceEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string; // ex: "Nettoyage vitres - Appartement"

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: CleanServiceType })
  type: CleanServiceType;

  @Column({ default: true })
  isActive: boolean;

  // Prix de base (MVP). Plus tard: pricing rules (surface, rooms, etc.)
  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  basePrice: number;

  @Column({ length: 8, default: 'EUR' })
  currency: string;

  // Durée estimée en minutes (utile planning)
  @Column({ type: 'int', default: 120 })
  estimatedDurationMin: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  imageUrl?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
