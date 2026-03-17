import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../auth/entities/user.entity';
import { Sector } from '../../core/sectors/entities/sector.entity';
import { TaskStatus, TaskPriority } from '../enums/task.enums';

@Entity('tasks')
export class Task {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({
    type: 'enum',
    enum: TaskStatus,
    default: TaskStatus.PENDING,
  })
  status: TaskStatus;

  @Column({
    type: 'enum',
    enum: TaskPriority,
    default: TaskPriority.MEDIUM,
  })
  priority: TaskPriority;

  @ManyToOne(() => User, { nullable: true })
  assignedTo?: User;

  @Column({ nullable: true })
  assignedToId?: string;

  @ManyToOne(() => User, { nullable: true })
  assignedBy?: User;

  @Column({ nullable: true })
  assignedById?: string;

  @ManyToOne(() => Sector, { nullable: true })
  sector?: Sector;

  @Column({ nullable: true })
  sectorId?: string;

  @Column({ type: 'timestamp', nullable: true })
  dueDate?: Date;

  @Column({ type: 'timestamp', nullable: true })
  completedAt?: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
