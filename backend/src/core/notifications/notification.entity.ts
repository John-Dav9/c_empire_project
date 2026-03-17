// src/core/notifications/notification.entity.ts
import { User } from 'src/auth/entities/user.entity';
import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
export type NotificationChannel = 'EMAIL' | 'SMS' | 'WHATSAPP' | 'IN_APP';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { nullable: true })
  user?: User;

  @Column()
  title: string;

  @Column()
  message: string;

  @Column({ type: 'varchar' })
  channel: NotificationChannel;

  @Column({ default: 'PENDING' })
  status: 'PENDING' | 'SENT' | 'FAILED';

  @CreateDateColumn()
  createdAt: Date;
}
