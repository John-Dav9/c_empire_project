import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { GrillMenuPackItem } from './grill-menu-pack-item.entity';

@Entity('grill_menu_packs')
export class GrillMenuPack {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ length: 120 })
  title: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  price: number;

  @Column({ length: 8, default: 'XAF' })
  currency: string;

  @Column({ default: true })
  isAvailable: boolean;

  @Column({ type: 'simple-array', nullable: true })
  images?: string[];

  @OneToMany(() => GrillMenuPackItem, (i) => i.pack, { cascade: true })
  items: GrillMenuPackItem[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
