import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity('relay_points')
export class RelayPoint {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 150 })
  name: string;

  @Column({ type: 'varchar', length: 255 })
  address: string;

  @Column({ type: 'varchar', length: 100 })
  city: string;

  @Column({ type: 'varchar', length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'varchar', length: 200, nullable: true })
  openingHours?: string;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lat?: number;

  @Column({ type: 'decimal', precision: 10, scale: 7, nullable: true })
  lng?: number;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
