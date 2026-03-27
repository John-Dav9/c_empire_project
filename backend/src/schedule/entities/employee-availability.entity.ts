import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';

@Entity('employee_availabilities')
export class EmployeeAvailability {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  employee: User;

  @Column()
  employeeId: string;

  /** Date de la disponibilité (YYYY-MM-DD) */
  @Column({ type: 'date' })
  date: string;

  /** Heure de début (HH:MM) */
  @Column({ length: 5 })
  startTime: string;

  /** Heure de fin (HH:MM) */
  @Column({ length: 5 })
  endTime: string;

  /** true = disponible, false = indisponible */
  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'text', nullable: true })
  note?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
