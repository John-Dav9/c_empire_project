import {
  IsEnum,
  IsDateString,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
} from 'class-validator';
import { PaymentProvider } from 'src/core/payments/providers/payment-provider.enum';

export class CreateEventBookingDto {
  @IsUUID()
  eventId: string;

  @IsDateString()
  eventDate: string;

  @IsString()
  @IsNotEmpty()
  location: string;

  @IsOptional()
  options?: Record<string, unknown>;

  @IsNotEmpty()
  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;
}
