import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { ImportExportStatus } from '../enums/import-export-status.enum';

@Entity('c_express_import_export')
export class ImportExportEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Utilisateur demandeur
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  // Origine / Destination
  @Column({ type: 'varchar', length: 100 })
  originCountry: string;

  @Column({ type: 'varchar', length: 100 })
  destinationCountry: string;

  // Description marchandise
  @Column({ type: 'varchar', length: 255 })
  description: string;

  // Dimensions / poids
  @Column({ type: 'float', default: 0 })
  weightKg: number;

  @Column({ type: 'float', default: 0 })
  volumeM3: number;

  // Prix
  @Column({ type: 'float', nullable: true })
  estimatedPrice?: number; // estimation initiale (IA / formule simple)

  @Column({ type: 'float', nullable: true })
  finalPrice?: number; // prix validé par admin

  // Statut
  @Index()
  @Column({
    type: 'enum',
    enum: ImportExportStatus,
    default: ImportExportStatus.REQUESTED,
  })
  status: ImportExportStatus;

  // Commentaire admin (devis, refus, précision)
  @Column({ type: 'text', nullable: true })
  adminComment?: string;

  // Notes utilisateur
  @Column({ type: 'text', nullable: true })
  customerNote?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
