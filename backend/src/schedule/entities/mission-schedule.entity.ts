import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Task } from '../../tasks/entities/task.entity';

@Entity('mission_schedules')
export class MissionSchedule {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  employee: User;

  @Column()
  employeeId: string;

  @ManyToOne(() => Task, { nullable: true, onDelete: 'SET NULL' })
  task?: Task;

  @Column({ nullable: true })
  taskId?: string;

  /** Titre de la mission planifiée */
  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  /** Date de la mission (YYYY-MM-DD) */
  @Column({ type: 'date' })
  date: string;

  /** Heure de début (HH:MM) */
  @Column({ length: 5 })
  startTime: string;

  /** Heure de fin (HH:MM) */
  @Column({ length: 5 })
  endTime: string;

  @ManyToOne(() => User, { nullable: true })
  scheduledBy?: User;

  @Column({ nullable: true })
  scheduledById?: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
