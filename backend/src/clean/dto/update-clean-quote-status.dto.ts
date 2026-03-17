import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { CleanQuoteStatus } from '../enums/clean-quote-status.enum';

export class UpdateCleanQuoteStatusDto {
  @IsEnum(CleanQuoteStatus)
  status: CleanQuoteStatus;

  @IsNumber()
  @Min(0)
  @IsOptional()
  proposedAmount?: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsOptional()
  adminMessage?: string;
}
