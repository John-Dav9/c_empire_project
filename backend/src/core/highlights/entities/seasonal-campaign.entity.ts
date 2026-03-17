import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';

export type CampaignItem = {
  sector: string;
  title: string;
  route: string;
  description?: string;
  imageUrl?: string;
};

@Entity('seasonal_campaigns')
export class SeasonalCampaign {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string;

  @Column({ length: 120 })
  festivalName: string;

  @Column({ length: 120, nullable: true })
  tabLabel?: string;

  @Column({ type: 'timestamp' })
  startDate: Date;

  @Column({ type: 'timestamp' })
  endDate: Date;

  @Column({ default: true })
  isActive: boolean;

  @Column({ type: 'simple-json', nullable: true })
  items?: CampaignItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
