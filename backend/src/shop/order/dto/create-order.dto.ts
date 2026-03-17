import { IsOptional, IsString, IsEnum, IsArray, IsUUID } from 'class-validator';
import { DeliveryOption } from '../order.entity';

export class CreateOrderDto {
  @IsOptional()
  @IsString()
  deliveryAddress?: string;

  @IsOptional()
  @IsString()
  note?: string;

  @IsOptional()
  @IsString()
  promoCode?: string;

  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  cartItemIds?: string[];

  @IsEnum(DeliveryOption)
  deliveryOption: DeliveryOption;
}
