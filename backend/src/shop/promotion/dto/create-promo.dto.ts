import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsOptional,
  IsPositive,
  IsString,
  IsUUID,
} from 'class-validator';
import { PromotionType } from '../promotion-type.enum';

export class CreatePromoDto {
  @IsArray()
  @IsUUID('4', { each: true })
  productIds: string[];

  @IsString()
  title: string;

  @IsOptional()
  @IsString()
  code?: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsEnum(PromotionType)
  type: PromotionType;

  @IsPositive()
  value: number;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  startsAt?: Date;

  @IsOptional()
  endsAt?: Date;
}
