import { IsBoolean, IsDateString, IsOptional, IsString, Matches } from 'class-validator';

const TIME_REGEX = /^([01]\d|2[0-3]):[0-5]\d$/;

export class CreateAvailabilityDto {
  @IsDateString()
  date: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'startTime must be HH:MM' })
  startTime: string;

  @IsString()
  @Matches(TIME_REGEX, { message: 'endTime must be HH:MM' })
  endTime: string;

  @IsBoolean()
  @IsOptional()
  isAvailable?: boolean;

  @IsString()
  @IsOptional()
  note?: string;
}
