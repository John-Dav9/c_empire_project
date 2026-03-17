import { createHmac } from 'crypto';
import { PaymentProvider } from '../providers/payment-provider.enum';

export class WebhookVerifier {
  static getSecret(provider: PaymentProvider): string {
    return String(
      provider === PaymentProvider.MTN_MOMO
        ? process.env.MTN_WEBHOOK_SECRET
        : provider === PaymentProvider.ORANGE_MONEY
          ? process.env.ORANGE_WEBHOOK_SECRET
          : process.env.PAYMENT_WEBHOOK_SECRET,
    ).trim();
  }

  static hasSecret(provider: PaymentProvider): boolean {
    return this.getSecret(provider).length > 0;
  }

  static verify(
    provider: PaymentProvider,
    rawBody: Buffer,
    headers: Record<string, string | string[] | undefined>,
  ) {
    const signatureHeader =
      headers['x-signature'] ?? headers['x-webhook-signature'];
    const signature = Array.isArray(signatureHeader)
      ? signatureHeader[0]
      : signatureHeader;

    const secret = this.getSecret(provider);

    if (!secret) {
      return false;
    }
    if (!signature) {
      return false;
    }

    const computed = createHmac('sha256', secret).update(rawBody).digest('hex');
    return computed === signature;
  }
}
