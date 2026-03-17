import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../core/roles/roles.guard';
import { Roles } from '../core/roles/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  private extractUserId(req: AuthenticatedRequest): string {
    return req.user?.userId ?? req.user?.id ?? req.user?.sub;
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(@Body() dto: CreateTaskDto, @Req() req: AuthenticatedRequest) {
    return this.tasksService.create(dto, this.extractUserId(req));
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll() {
    return this.tasksService.findAll();
  }

  @Get('my-tasks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  getMyTasks(@Req() req: AuthenticatedRequest) {
    return this.tasksService.findByEmployee(this.extractUserId(req));
  }

  @Get('employee/:employeeId')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getEmployeeTasks(@Param('employeeId') employeeId: string) {
    return this.tasksService.findByEmployee(employeeId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.tasksService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateTaskDto) {
    return this.tasksService.update(id, dto);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  remove(@Param('id') id: string) {
    return this.tasksService.remove(id);
  }
}
