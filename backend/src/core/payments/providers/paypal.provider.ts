import { BadRequestException, Injectable } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.enum';
import {
  IPaymentProvider,
  InitPaymentParams,
  InitPaymentResult,
} from './payment-provider.interface';

@Injectable()
export class PaypalProvider implements IPaymentProvider {
  supports(provider: PaymentProvider): boolean {
    return provider === PaymentProvider.PAYPAL;
  }

  async initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      throw new BadRequestException(
        'Paypal mock provider disabled outside mock mode.',
      );
    }

    return {
      provider: PaymentProvider.PAYPAL,
      providerTransactionId: `paypal_${params.orderId}_${Date.now()}`,
      redirectUrl: `https://example.com/mock-paypal?order=${params.orderId}`,
      raw: params,
    };
  }

  async verifyPayment(): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      throw new BadRequestException(
        'Paypal mock provider disabled outside mock mode.',
      );
    }
    return 'SUCCESS';
  }
}
