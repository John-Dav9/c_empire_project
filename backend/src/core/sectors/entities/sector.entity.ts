import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../../auth/entities/user.entity';
import { Product } from '../../../shop/product/product.entity';

@Entity('sectors')
export class Sector {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  name: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'varchar', length: 50, unique: true, nullable: true })
  code?: string;

  @Column({ type: 'text', nullable: true })
  iconUrl?: string;

  @Column({ type: 'simple-json', nullable: true })
  imageUrls?: string[];

  @Column({ default: true })
  isActive: boolean;

  @OneToMany(() => User, (user) => user.sector)
  users: User[];

  @OneToMany(() => Product, (product) => product.sector)
  products: Product[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
