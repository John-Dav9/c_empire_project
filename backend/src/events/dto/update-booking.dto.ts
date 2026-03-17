import { IsDateString, IsOptional, IsString } from 'class-validator';

export class UpdateEventBookingDto {
  @IsDateString()
  @IsOptional()
  eventDate?: string;

  @IsString()
  @IsOptional()
  location?: string;

  @IsOptional()
  options?: Record<string, unknown>;
}
