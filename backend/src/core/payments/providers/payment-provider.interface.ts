import { PaymentProvider } from './payment-provider.enum';

export type InitPaymentParams = {
  userId?: string;
  orderId?: string;
  amount: number;
  currency: string;
  provider: PaymentProvider;
  metadata?: Record<string, unknown>;
};

export type InitPaymentResult = {
  provider: PaymentProvider;
  providerTransactionId: string;
  redirectUrl?: string;
  instructions?: string;
  raw?: Record<string, unknown>;
};

export type PaymentVerificationResult = {
  provider: PaymentProvider;
  providerTransactionId: string;
  status: 'SUCCESS' | 'FAILED' | 'PENDING';
  raw?: Record<string, unknown>;
};

export interface IPaymentProvider {
  supports(provider: PaymentProvider): boolean;
  initPayment(params: InitPaymentParams): Promise<InitPaymentResult>;
  verifyPayment(
    providerTransactionId: string,
  ): Promise<'SUCCESS' | 'FAILED' | 'PENDING'>;
}
