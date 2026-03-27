import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { TasksService } from './tasks.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../core/roles/roles.guard';
import { Roles } from '../core/roles/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('tasks')
@UseGuards(JwtAuthGuard)
export class TasksController {
  constructor(private readonly tasksService: TasksService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  create(
    @Body() dto: CreateTaskDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.tasksService.create(dto, userId);
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  findAll(
    @Query('page') page = '1',
    @Query('limit') limit = '20',
    @Query('status') status?: string,
    @Query('priority') priority?: string,
  ) {
    return this.tasksService.findAll(+page, +limit, status, priority);
  }

  @Get('my-tasks')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE)
  getMyTasks(@CurrentUser('userId') userId: string) {
    return this.tasksService.findByEmployee(userId);
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
