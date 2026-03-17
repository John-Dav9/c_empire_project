import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  ManyToOne,
} from 'typeorm';
import { Profile } from './profile.entity';
import { Role } from 'src/core/roles/role.entity';
import { UserRole } from '../enums/user-role.enum';
import { Sector } from 'src/core/sectors/entities/sector.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CLIENT,
  })
  role: UserRole;

  @Column({ nullable: true })
  firstname: string;

  @Column({ nullable: true })
  lastname: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ default: true })
  isActive: boolean;

  // ✅ IMPORTANT: explicite le type SQL
  @Column({ type: 'varchar', nullable: true })
  resetPasswordToken: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  resetPasswordExpires: Date | null;

  @Column({ type: 'varchar', nullable: true })
  refreshTokenHash: string | null;

  @ManyToOne(() => Sector, (sector) => sector.users, { nullable: true })
  sector?: Sector | null;

  @Column({ nullable: true })
  sectorId?: string | null;

  @OneToOne(() => Profile, (profile) => profile.user, { cascade: true })
  @JoinColumn()
  profile: Profile;

  @ManyToMany(() => Role, (role) => role.users, { eager: true })
  @JoinTable({ name: 'user_roles' })
  roles: Role[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
