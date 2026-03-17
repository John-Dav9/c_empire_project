import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EventCategory } from '../enums/event-category.enum';

export class UpdateEventDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsEnum(EventCategory)
  @IsOptional()
  category?: EventCategory;

  @IsNumber()
  @Min(0)
  @IsOptional()
  basePrice?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
