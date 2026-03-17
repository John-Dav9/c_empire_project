import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CleanBookingStatus } from '../enums/clean-booking-status.enum';

export class UpdateCleanBookingStatusDto {
  @IsEnum(CleanBookingStatus)
  status: CleanBookingStatus;

  @IsString()
  @IsOptional()
  assignedTo?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
