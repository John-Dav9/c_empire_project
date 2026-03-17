import {
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateDeliveryDto {
  // Adresses
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  pickupAddress: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  deliveryAddress: string;

  // Coordonnées GPS (optionnel)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pickupLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  pickupLng?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryLat?: number;

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  deliveryLng?: number;

  // Colis
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  packageType: string; // "document" | "parcel" | "food" | ...

  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(200)
  weightKg?: number = 0;

  // Distance (optionnel: si calculée côté backend, tu peux ignorer ce champ)
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @Max(5000)
  distanceKm?: number;

  // Urgence (1 normal / 2 urgent / 3 très urgent)
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(3)
  urgencyLevel?: number = 1;

  // Notes
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  customerNote?: string;
}
