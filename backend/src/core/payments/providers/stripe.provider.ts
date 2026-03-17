import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { PaymentProvider } from './payment-provider.enum';
import {
  IPaymentProvider,
  InitPaymentParams,
  InitPaymentResult,
} from './payment-provider.interface';

type StripeCheckoutSession = {
  id: string;
  url?: string;
  payment_status?: 'paid' | 'unpaid' | 'no_payment_required';
  status?: 'open' | 'complete' | 'expired';
};

@Injectable()
export class StripeProvider implements IPaymentProvider {
  private readonly logger = new Logger(StripeProvider.name);

  supports(provider: PaymentProvider): boolean {
    return provider === PaymentProvider.STRIPE;
  }

  async initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException(
        'STRIPE_SECRET_KEY manquante. Configuration Stripe requise.',
      );
    }

    const appBaseUrl = process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200';
    const successUrl =
      process.env.STRIPE_SUCCESS_URL ??
      `${appBaseUrl}/payments/checkout?status=success&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      process.env.STRIPE_CANCEL_URL ??
      `${appBaseUrl}/payments/checkout?status=cancel`;

    const amountInSmallestUnit = Math.round(Number(params.amount || 0));
    if (!amountInSmallestUnit || amountInSmallestUnit <= 0) {
      throw new BadRequestException('Montant Stripe invalide.');
    }

    const body = new URLSearchParams();
    body.set('mode', 'payment');
    body.set('success_url', successUrl);
    body.set('cancel_url', cancelUrl);
    body.set(
      'line_items[0][price_data][currency]',
      params.currency.toLowerCase(),
    );
    body.set(
      'line_items[0][price_data][unit_amount]',
      String(amountInSmallestUnit),
    );
    body.set(
      'line_items[0][price_data][product_data][name]',
      "Commande C'Empire",
    );
    body.set('line_items[0][quantity]', '1');
    body.set('metadata[referenceId]', String(params.orderId || ''));
    body.set('metadata[provider]', PaymentProvider.STRIPE);

    const session = await this.requestStripe<StripeCheckoutSession>(
      'https://api.stripe.com/v1/checkout/sessions',
      {
        method: 'POST',
        body,
      },
    );

    if (!session?.id) {
      throw new BadRequestException(
        'Impossible de créer une session Stripe Checkout.',
      );
    }

    return {
      provider: PaymentProvider.STRIPE,
      providerTransactionId: session.id,
      redirectUrl: session.url || undefined,
      raw: {
        referenceId: params.orderId,
        sessionId: session.id,
      },
    };
  }

  async verifyPayment(
    providerTransactionId: string,
  ): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    if (!providerTransactionId) return 'PENDING';
    const session = await this.requestStripe<StripeCheckoutSession>(
      `https://api.stripe.com/v1/checkout/sessions/${encodeURIComponent(providerTransactionId)}`,
      {
        method: 'GET',
      },
    );

    if (session?.payment_status === 'paid' || session?.status === 'complete') {
      return 'SUCCESS';
    }

    if (session?.status === 'expired') {
      return 'FAILED';
    }

    return 'PENDING';
  }

  private async requestStripe<T>(
    url: string,
    init: {
      method: 'GET' | 'POST';
      body?: URLSearchParams;
    },
  ): Promise<T> {
    const secretKey = process.env.STRIPE_SECRET_KEY;
    if (!secretKey) {
      throw new BadRequestException('STRIPE_SECRET_KEY manquante.');
    }

    const auth = Buffer.from(`${secretKey}:`).toString('base64');
    const response = await fetch(url, {
      method: init.method,
      headers: {
        Authorization: `Basic ${auth}`,
        ...(init.body
          ? { 'Content-Type': 'application/x-www-form-urlencoded' }
          : {}),
      },
      body: init.body?.toString(),
    });

    const payload = (await response.json().catch(() => null)) as
      | (T & { error?: { message?: string } })
      | null;

    if (!response.ok) {
      const message =
        payload?.error?.message || `Stripe error (HTTP ${response.status})`;
      this.logger.error(message);
      throw new BadRequestException(message);
    }

    if (!payload) {
      throw new BadRequestException('Réponse Stripe vide.');
    }

    return payload as T;
  }
}
