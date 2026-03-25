import { IsString, IsNotEmpty, IsOptional, IsNumber, MaxLength } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateRelayPointDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(150)
  name: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(100)
  city: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  phone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  openingHours?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  lng?: number;

  @IsOptional()
  @IsString()
  note?: string;
}
