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
import { ScheduleService } from './schedule.service';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateMissionScheduleDto } from './dto/create-mission-schedule.dto';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../core/roles/roles.guard';
import { Roles } from '../core/roles/roles.decorator';
import { UserRole } from '../auth/enums/user-role.enum';
import { CurrentUser } from '../auth/decorators/current-user.decorator';

@Controller('schedule')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ScheduleController {
  constructor(private readonly scheduleService: ScheduleService) {}

  // ── Employee: manage own availabilities ─────────────────────────────────

  @Post('availability')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createAvailability(
    @Body() dto: CreateAvailabilityDto,
    @CurrentUser('userId') employeeId: string,
  ) {
    return this.scheduleService.createAvailability(employeeId, dto);
  }

  @Get('availability/me')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getMyAvailabilities(@CurrentUser('userId') employeeId: string) {
    return this.scheduleService.getMyAvailabilities(employeeId);
  }

  @Patch('availability/:id')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  updateAvailability(
    @Param('id') id: string,
    @Body() dto: Partial<CreateAvailabilityDto>,
    @CurrentUser('userId') employeeId: string,
  ) {
    return this.scheduleService.updateAvailability(id, employeeId, dto);
  }

  @Delete('availability/:id')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  deleteAvailability(
    @Param('id') id: string,
    @CurrentUser('userId') employeeId: string,
  ) {
    return this.scheduleService.deleteAvailability(id, employeeId);
  }

  // ── Admin/Super-admin: view all availabilities ───────────────────────────

  @Get('availability/all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllAvailabilities() {
    return this.scheduleService.getAllAvailabilities();
  }

  @Get('availability/employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getEmployeeAvailabilities(@Param('employeeId') employeeId: string) {
    return this.scheduleService.getEmployeeAvailabilities(employeeId);
  }

  // ── Admin/Super-admin: schedule missions ─────────────────────────────────

  @Post('missions')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  createMissionSchedule(
    @Body() dto: CreateMissionScheduleDto,
    @CurrentUser('userId') scheduledById: string,
  ) {
    return this.scheduleService.createMissionSchedule(scheduledById, dto);
  }

  @Get('missions/all')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getAllMissionSchedules() {
    return this.scheduleService.getAllMissionSchedules();
  }

  @Get('missions/employee/:employeeId')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getMissionsByEmployee(@Param('employeeId') employeeId: string) {
    return this.scheduleService.getMissionSchedulesByEmployee(employeeId);
  }

  @Get('missions/me')
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  getMyMissions(@CurrentUser('userId') employeeId: string) {
    return this.scheduleService.getMissionSchedulesByEmployee(employeeId);
  }

  @Delete('missions/:id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  deleteMissionSchedule(@Param('id') id: string) {
    return this.scheduleService.deleteMissionSchedule(id);
  }
}
