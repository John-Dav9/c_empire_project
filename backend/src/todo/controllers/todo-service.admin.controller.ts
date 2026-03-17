// src/sectors/c-todo/controllers/todo-service.admin.controller.ts
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
import { TodoServiceAdminService } from '../services/todo-service.admin.service';
import { CreateTodoServiceDto } from '../dto/create-todo-service.dto';
import { UpdateTodoServiceDto } from '../dto/update-todo-service.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';

@Controller('admin/c-todo/services')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class TodoServiceAdminController {
  constructor(private readonly service: TodoServiceAdminService) {}

  @Post()
  @Permissions('todo:services:create')
  create(@Body() dto: CreateTodoServiceDto) {
    return this.service.create(dto);
  }

  @Get()
  @Permissions('todo:services:read')
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id')
  @Permissions('todo:services:update')
  update(@Param('id') id: string, @Body() dto: UpdateTodoServiceDto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @Permissions('todo:services:delete')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
