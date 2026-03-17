import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.enum';
import {
  IPaymentProvider,
  InitPaymentParams,
  InitPaymentResult,
} from './payment-provider.interface';

@Injectable()
export class CardPaymentProvider implements IPaymentProvider {
  supports(provider: PaymentProvider): boolean {
    return (
      provider === PaymentProvider.CARD || provider === PaymentProvider.STRIPE
    );
  }

  async initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      throw new BadRequestException(
        'Card mock provider disabled outside mock mode.',
      );
    }

    return {
      provider: params.provider,
      providerTransactionId: `card_${params.orderId}_${Date.now()}`,
      redirectUrl: `https://example.com/mock-card-pay?ref=${params.orderId}`,
      raw: params,
    };
  }

  async verifyPayment(): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      throw new BadRequestException(
        'Card mock provider disabled outside mock mode.',
      );
    }
    return 'SUCCESS';
  }
}
