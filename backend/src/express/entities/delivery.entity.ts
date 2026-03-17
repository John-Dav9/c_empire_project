import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { DeliveryStatus } from '../enums/delivery-status.enum';

@Entity('c_express_deliveries')
export class DeliveryEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // On garde userId simple pour éviter de dépendre d'une relation (tu peux ajouter ManyToOne plus tard)
  @Index()
  @Column({ type: 'uuid' })
  userId: string;

  // Adresses
  @Column({ type: 'varchar', length: 255 })
  pickupAddress: string;

  @Column({ type: 'varchar', length: 255 })
  deliveryAddress: string;

  // Optionnel: coordonnées GPS si tu veux du calcul distance / suivi plus précis
  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickupLat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  pickupLng?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  deliveryLng?: number;

  // Colis
  @Column({ type: 'varchar', length: 60 })
  packageType: string; // ex: "document", "food", "parcel", ...

  @Column({ type: 'float', default: 0 })
  weightKg: number;

  // Distance & urgence
  @Column({ type: 'float', nullable: true })
  distanceKm?: number;

  @Column({ type: 'int', default: 1 })
  urgencyLevel: number; // 1=normal, 2=urgent, 3=très urgent (tu peux affiner)

  // Tarification & paiement
  @Column({ type: 'float', default: 0 })
  price: number;

  @Column({ type: 'boolean', default: false })
  paid: boolean;

  // Assignation livreur
  @Index()
  @Column({ type: 'uuid', nullable: true })
  courierId?: string;

  // Statut
  @Index()
  @Column({
    type: 'enum',
    enum: DeliveryStatus,
    default: DeliveryStatus.PENDING,
  })
  status: DeliveryStatus;

  // Notes
  @Column({ type: 'text', nullable: true })
  customerNote?: string;

  @Column({ type: 'text', nullable: true })
  adminNote?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
