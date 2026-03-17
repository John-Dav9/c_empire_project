import { Injectable, BadRequestException } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.enum';
import {
  IPaymentProvider,
  InitPaymentParams,
  InitPaymentResult,
} from './payment-provider.interface';

@Injectable()
export class WalletProvider implements IPaymentProvider {
  supports(provider: PaymentProvider): boolean {
    return provider === PaymentProvider.WALLET;
  }

  async initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      throw new BadRequestException(
        'Wallet mock provider disabled outside mock mode.',
      );
    }

    if (!params.userId) {
      throw new BadRequestException('userId is required for wallet payment');
    }

    return {
      provider: PaymentProvider.WALLET,
      providerTransactionId: `wallet_${params.orderId}_${Date.now()}`,
      instructions: 'Wallet payment initiated (mock)',
      raw: params,
    };
  }

  async verifyPayment(): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    if (process.env.ALLOW_MOCK_PAYMENTS !== 'true') {
      throw new BadRequestException(
        'Wallet mock provider disabled outside mock mode.',
      );
    }
    return 'SUCCESS';
  }
}
