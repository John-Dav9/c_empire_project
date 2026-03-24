import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../core/roles/roles.guard';
import { Roles } from '../core/roles/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Get('users')
  @Permissions('users:read')
  async getAllUsers(
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
    @Query('search') search?: string,
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    const isActiveBoolean =
      isActive === 'true' ? true : isActive === 'false' ? false : undefined;
    return this.adminService.getAllUsers(
      parseInt(page, 10),
      parseInt(limit, 10),
      search,
      role,
      isActiveBoolean,
    );
  }

  @Get('users/:id')
  @Permissions('users:read')
  async getUserById(@Param('id') id: string) {
    return this.adminService.getUserById(id);
  }

  @Get('stats')
  @Permissions('admin:access')
  async getStats() {
    return this.adminService.getStats();
  }

  @Patch('users/:id/role')
  @Permissions('users:update')
  async updateUserRole(
    @Param('id') userId: string,
    @Body('role') role: UserRole,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.adminService.updateUserRole(userId, role, actorId);
  }

  @Patch('users/:id/toggle-status')
  @Permissions('users:update')
  async toggleUserStatus(
    @Param('id') userId: string,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.adminService.toggleUserStatus(userId, actorId);
  }

  @Delete('users/:id')
  @Permissions('users:delete')
  async deleteUser(
    @Param('id') userId: string,
    @CurrentUser('userId') actorId: string,
  ) {
    return this.adminService.deleteUser(userId, actorId);
  }
}
