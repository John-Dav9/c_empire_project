import { IsOptional, IsString, IsEnum, IsArray, IsUUID, ValidateIf } from 'class-validator';
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

  /** Requis uniquement si deliveryOption === RELAY */
  @ValidateIf((o: CreateOrderDto) => o.deliveryOption === DeliveryOption.RELAY)
  @IsUUID('4')
  relayPointId?: string;
}
