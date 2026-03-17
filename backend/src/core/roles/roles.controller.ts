// src/core/roles/roles.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { RolesService } from './roles.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from './roles.guard';
import { Roles } from './roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';

@Controller('roles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.SUPER_ADMIN)
export class RolesController {
  constructor(private readonly rolesService: RolesService) {}

  // 👉 Créer un rôle
  @Post()
  async createRole(
    @Body()
    body: {
      code: string;
      label: string;
      permissions?: string[];
    },
  ) {
    return this.rolesService.create(body.code, body.label, body.permissions);
  }

  // 👉 Récupérer tous les rôles
  @Get()
  async findAll() {
    return this.rolesService.findAll();
  }

  // 👉 Récupérer un rôle par ID
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.rolesService.findOne(id);
  }

  // 👉 Modifier un rôle
  @Patch(':id')
  async updateRole(
    @Param('id') id: string,
    @Body()
    data: Partial<{
      code: string;
      label: string;
      permissions: string[];
    }>,
  ) {
    return this.rolesService.update(id, data);
  }

  // 👉 Supprimer un rôle
  @Delete(':id')
  async deleteRole(@Param('id') id: string) {
    return this.rolesService.remove(id);
  }

  // 👉 Assigner un rôle à un utilisateur
  @Post(':roleCode/assign/:userId')
  async assignRole(
    @Param('roleCode') roleCode: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.assignRoleToUser(userId, roleCode);
  }

  // 👉 Retirer un rôle à un utilisateur
  @Post(':roleCode/remove/:userId')
  async removeRole(
    @Param('roleCode') roleCode: string,
    @Param('userId') userId: string,
  ) {
    return this.rolesService.removeRoleFromUser(userId, roleCode);
  }
}
