// src/sectors/c-todo/controllers/todo-admin-stats.controller.ts
import { Controller, Get } from '@nestjs/common';
import { TodoStatsService } from '../services/todo-stats.service';
import { UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';

@Controller('admin/c-todo/stats')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class TodoAdminStatsController {
  constructor(private readonly stats: TodoStatsService) {}

  @Get('summary')
  summary() {
    return this.stats.summary();
  }
}
