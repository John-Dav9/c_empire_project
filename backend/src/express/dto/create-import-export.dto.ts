import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateImportExportDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  originCountry: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  destinationCountry: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  description: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(100000)
  weightKg?: number = 0;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(1000)
  volumeM3?: number = 0;

  @IsOptional()
  @IsString()
  @MaxLength(1500)
  customerNote?: string;
}
