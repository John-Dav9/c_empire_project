// src/core/roles/roles.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Role } from './role.entity';
import { User } from 'src/auth/entities/user.entity';

@Injectable()
export class RolesService {
  constructor(
    @InjectRepository(Role)
    private readonly roleRepo: Repository<Role>,

    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
  ) {}

  // Création d'un rôle
  async create(
    code: string,
    label: string,
    permissions?: string[],
  ): Promise<Role> {
    const role = this.roleRepo.create({ code, label, permissions });
    return this.roleRepo.save(role);
  }

  // Liste de tous les rôles
  findAll(): Promise<Role[]> {
    return this.roleRepo.find();
  }

  // Récupérer un rôle par id
  async findOne(id: string): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { id } });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  // Récupérer un rôle par code (ADMIN, CLIENT, etc.)
  async findByCode(code: string): Promise<Role> {
    const role = await this.roleRepo.findOne({ where: { code } });
    if (!role) {
      throw new NotFoundException(`Role with code ${code} not found`);
    }
    return role;
  }

  // Mise à jour d'un rôle
  async update(
    id: string,
    data: Partial<Pick<Role, 'code' | 'label' | 'permissions'>>,
  ): Promise<Role> {
    const role = await this.findOne(id);
    Object.assign(role, data);
    return this.roleRepo.save(role);
  }

  // Suppression d'un rôle
  async remove(id: string): Promise<{ deleted: boolean }> {
    const role = await this.findOne(id);
    await this.roleRepo.remove(role);
    return { deleted: true };
  }

  // Assigner un rôle à un utilisateur
  async assignRoleToUser(userId: string, roleCode: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.findByCode(roleCode);

    if (!user.roles) user.roles = [];
    const alreadyHasRole = user.roles.some(
      (r) => r.id === role.id || r.code === role.code,
    );
    if (!alreadyHasRole) {
      user.roles.push(role);
      await this.userRepo.save(user);
    }

    return user;
  }

  // Retirer un rôle à un utilisateur
  async removeRoleFromUser(userId: string, roleCode: string): Promise<User> {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const role = await this.findByCode(roleCode);

    user.roles = (user.roles || []).filter(
      (r) => r.id !== role.id && r.code !== role.code,
    );

    await this.userRepo.save(user);
    return user;
  }
}
