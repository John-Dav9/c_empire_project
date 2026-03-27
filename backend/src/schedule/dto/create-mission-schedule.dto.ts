import { IsDateString, IsOptional, IsString, IsUUID, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateMissionScheduleDto {
  @IsUUID()
  employeeId: string;

  @IsString()
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsDateString()
  date: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM' })
  startTime: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM' })
  endTime: string;

  @IsUUID()
  @IsOptional()
  taskId?: string;
}
