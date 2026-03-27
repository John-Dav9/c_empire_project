import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { EmployeeAvailability } from './entities/employee-availability.entity';
import { MissionSchedule } from './entities/mission-schedule.entity';
import { CreateAvailabilityDto } from './dto/create-availability.dto';
import { CreateMissionScheduleDto } from './dto/create-mission-schedule.dto';

@Injectable()
export class ScheduleService {
  constructor(
    @InjectRepository(EmployeeAvailability)
    private availabilityRepo: Repository<EmployeeAvailability>,
    @InjectRepository(MissionSchedule)
    private missionScheduleRepo: Repository<MissionSchedule>,
  ) {}

  // ────────── Availabilities ──────────

  async createAvailability(
    employeeId: string,
    dto: CreateAvailabilityDto,
  ): Promise<EmployeeAvailability> {
    const availability = this.availabilityRepo.create({
      employeeId,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      isAvailable: dto.isAvailable ?? true,
      note: dto.note,
    });
    return this.availabilityRepo.save(availability);
  }

  async getMyAvailabilities(employeeId: string): Promise<EmployeeAvailability[]> {
    return this.availabilityRepo.find({
      where: { employeeId },
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async getEmployeeAvailabilities(employeeId: string): Promise<EmployeeAvailability[]> {
    return this.availabilityRepo.find({
      where: { employeeId },
      relations: ['employee'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async getAllAvailabilities(): Promise<EmployeeAvailability[]> {
    return this.availabilityRepo.find({
      relations: ['employee'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async updateAvailability(
    id: string,
    employeeId: string,
    dto: Partial<CreateAvailabilityDto>,
  ): Promise<EmployeeAvailability> {
    const availability = await this.availabilityRepo.findOne({
      where: { id, employeeId },
    });
    if (!availability) throw new NotFoundException('Availability not found');
    Object.assign(availability, dto);
    return this.availabilityRepo.save(availability);
  }

  async deleteAvailability(id: string, employeeId: string): Promise<{ deleted: boolean }> {
    const availability = await this.availabilityRepo.findOne({
      where: { id, employeeId },
    });
    if (!availability) throw new NotFoundException('Availability not found');
    await this.availabilityRepo.remove(availability);
    return { deleted: true };
  }

  // ────────── Mission Schedules ──────────

  async createMissionSchedule(
    scheduledById: string,
    dto: CreateMissionScheduleDto,
  ): Promise<MissionSchedule> {
    const schedule = this.missionScheduleRepo.create({
      employeeId: dto.employeeId,
      title: dto.title,
      description: dto.description,
      date: dto.date,
      startTime: dto.startTime,
      endTime: dto.endTime,
      taskId: dto.taskId,
      scheduledById,
    });
    return this.missionScheduleRepo.save(schedule);
  }

  async getMissionSchedulesByEmployee(employeeId: string): Promise<MissionSchedule[]> {
    return this.missionScheduleRepo.find({
      where: { employeeId },
      relations: ['task', 'scheduledBy'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async getAllMissionSchedules(): Promise<MissionSchedule[]> {
    return this.missionScheduleRepo.find({
      relations: ['employee', 'task', 'scheduledBy'],
      order: { date: 'ASC', startTime: 'ASC' },
    });
  }

  async deleteMissionSchedule(id: string): Promise<{ deleted: boolean }> {
    const schedule = await this.missionScheduleRepo.findOne({ where: { id } });
    if (!schedule) throw new NotFoundException('Mission schedule not found');
    await this.missionScheduleRepo.remove(schedule);
    return { deleted: true };
  }
}
