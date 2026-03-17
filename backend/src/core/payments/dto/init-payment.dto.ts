import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { PaymentProvider } from '../providers/payment-provider.enum';
import { PaymentReferenceType } from '../payment-reference-type.enum';

export class InitPaymentDto {
  @IsEnum(PaymentReferenceType)
  referenceType: PaymentReferenceType;

  @IsString()
  @IsNotEmpty()
  referenceId: string;

  @IsOptional()
  @IsString()
  currency?: string;

  @IsEnum(PaymentProvider)
  provider: PaymentProvider;

  @IsOptional()
  metadata?: Record<string, unknown>;
}
