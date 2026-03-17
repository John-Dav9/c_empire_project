import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('c_express_couriers')
export class CourierEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Identité
  @Column({ type: 'varchar', length: 120 })
  fullName: string;

  @Index()
  @Column({ type: 'varchar', length: 30 })
  phone: string;

  // Moyen de transport
  @Column({ type: 'varchar', length: 50 })
  vehicleType: string; // moto | voiture | camion | vélo

  // Disponibilité
  @Index()
  @Column({ type: 'boolean', default: true })
  available: boolean;

  // Zone d’activité (optionnel)
  @Column({ type: 'varchar', length: 100, nullable: true })
  city?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  country?: string;

  // Notes admin
  @Column({ type: 'text', nullable: true })
  adminNote?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
