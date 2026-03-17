import { IsInt, IsPositive, IsUUID } from 'class-validator';

export class AddToCartDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @IsPositive()
  quantity: number;
}
