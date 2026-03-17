import { IsEnum, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from 'src/core/payments/providers/payment-provider.enum';

export class CreateDeliveryPaymentDto {
  @IsString()
  deliveryId: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
