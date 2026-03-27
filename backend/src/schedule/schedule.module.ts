import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EmployeeAvailability } from './entities/employee-availability.entity';
import { MissionSchedule } from './entities/mission-schedule.entity';
import { ScheduleService } from './schedule.service';
import { ScheduleController } from './schedule.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([EmployeeAvailability, MissionSchedule]),
  ],
  controllers: [ScheduleController],
  providers: [ScheduleService],
  exports: [ScheduleService],
})
export class ScheduleModule {}
