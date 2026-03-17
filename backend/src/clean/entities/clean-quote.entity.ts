import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { CleanQuoteStatus } from '../enums/clean-quote-status.enum';

@Entity('clean_quotes')
export class CleanQuote {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Infos client (MVP). Plus tard: relation user
  @Column({ length: 120 })
  fullName: string;

  @Column({ length: 120 })
  email: string;

  @Column({ length: 40, nullable: true })
  phone?: string;

  // Détails demande
  @Column({ length: 120 })
  serviceTitle: string; // ex: "Nettoyage chantier"

  @Column({ type: 'text' })
  requestDetails: string; // description libre

  @Column({ length: 200 })
  address: string;

  @Column({ nullable: true })
  city?: string;

  @Column({ nullable: true })
  preferredDate?: string; // ISO string en texte (MVP)

  @Column({
    type: 'enum',
    enum: CleanQuoteStatus,
    default: CleanQuoteStatus.PENDING,
  })
  status: CleanQuoteStatus;

  // Réponse admin (devis)
  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  proposedAmount?: number;

  @Column({ length: 8, default: 'EUR' })
  currency: string;

  @Column({ type: 'text', nullable: true })
  adminMessage?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
