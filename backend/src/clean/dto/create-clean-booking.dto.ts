import {
  IsEmail,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateCleanBookingDto {
  @IsString()
  @IsNotEmpty()
  cleanServiceId: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  serviceTitle: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsString()
  @IsOptional()
  currency?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  fullName: string;

  @IsEmail()
  @MaxLength(120)
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(40)
  phone?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  city?: string;

  @IsString()
  @IsNotEmpty()
  scheduledAt: string; // ISO
}
