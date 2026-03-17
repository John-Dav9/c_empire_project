// src/core/roles/role.entity.ts
import { User } from 'src/auth/entities/user.entity';
import { Column, Entity, ManyToMany, PrimaryGeneratedColumn } from 'typeorm';

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  code: string; // 'ADMIN', 'CLIENT', 'SECTOR_MANAGER', etc.

  @Column({ nullable: true })
  label?: string;

  @Column('simple-array', { nullable: true })
  permissions: string[]; // ['event.create', 'shop.order.validate', ... ]

  @ManyToMany(() => User, (user) => user.roles)
  users: User[];
}
