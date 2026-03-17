import { IsEnum, IsNotEmpty, IsNumber, IsString, Min } from 'class-validator';
import { EventCategory } from '../enums/event-category.enum';

export class CreateEventDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  description: string;

  @IsEnum(EventCategory)
  category: EventCategory;

  @IsNumber()
  @Min(0)
  basePrice: number;
}
