import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { CleanServiceType } from '../enums/clean-service-type.enum';

export class CreateCleanServiceDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  title: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(CleanServiceType)
  type: CleanServiceType;

  @IsNumber()
  @Min(0)
  basePrice: number;

  @IsString()
  @IsOptional()
  @MaxLength(255)
  imageUrl?: string;

  @IsString()
  @IsOptional()
  @MaxLength(8)
  currency?: string;

  @IsInt()
  @Min(15)
  @IsOptional()
  estimatedDurationMin?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
