import {
  IsEmail,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateCleanQuoteDto {
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
  @MaxLength(120)
  serviceTitle: string;

  @IsString()
  @IsNotEmpty()
  requestDetails: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  address: string;

  @IsString()
  @IsOptional()
  @MaxLength(80)
  city?: string;

  @IsString()
  @IsOptional()
  preferredDate?: string;
}
