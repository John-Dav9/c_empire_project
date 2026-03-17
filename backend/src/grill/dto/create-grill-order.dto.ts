import { GrillDeliveryMode } from '../enums/grill-delivery-mode.enum';
import {
  IsArray,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Min,
  ValidateIf,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class CreateGrillOrderItemDto {
  @IsOptional()
  @IsString()
  productId: string;

  @IsOptional()
  @IsString()
  menupackId?: string;

  @Type(() => Number)
  @Min(1)
  qty: number;
}

export class CreateGrillOrderDto {
  @IsString()
  @IsNotEmpty()
  fullName: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsEnum(GrillDeliveryMode)
  deliveryMode: GrillDeliveryMode;

  @ValidateIf(
    (o: CreateGrillOrderDto) => o.deliveryMode === GrillDeliveryMode.DELIVERY,
  )
  @IsString()
  @IsNotEmpty()
  address?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateGrillOrderItemDto)
  items: CreateGrillOrderItemDto[];
}
