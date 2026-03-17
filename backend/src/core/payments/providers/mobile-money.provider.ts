import { BadRequestException, Injectable } from '@nestjs/common';
import { randomUUID } from 'crypto';
import { PaymentProvider } from './payment-provider.enum';
import {
  IPaymentProvider,
  InitPaymentParams,
  InitPaymentResult,
} from './payment-provider.interface';

type JsonRecord = Record<string, unknown>;

function pickString(...values: unknown[]): string {
  for (const value of values) {
    if (typeof value === 'string') {
      return value.trim();
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
  }
  return '';
}

@Injectable()
export class MobileMoneyProvider implements IPaymentProvider {
  supports(provider: PaymentProvider): boolean {
    return (
      provider === PaymentProvider.ORANGE_MONEY ||
      provider === PaymentProvider.MTN_MOMO ||
      provider === PaymentProvider.WAVE
    );
  }

  async initPayment(params: InitPaymentParams): Promise<InitPaymentResult> {
    switch (params.provider) {
      case PaymentProvider.MTN_MOMO:
        return this.initMtnMomo(params);
      case PaymentProvider.ORANGE_MONEY:
        return this.initOrangeMoney(params);
      case PaymentProvider.WAVE:
      default:
        throw new BadRequestException(
          `${params.provider} n'est pas encore configuré en mode réel.`,
        );
    }
  }

  async verifyPayment(
    providerTransactionId: string,
  ): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    if (providerTransactionId.startsWith('mtn:')) {
      return this.verifyMtn(providerTransactionId.replace('mtn:', ''));
    }
    if (providerTransactionId.startsWith('orange:')) {
      return this.verifyOrange(providerTransactionId.replace('orange:', ''));
    }
    return 'PENDING';
  }

  private async initMtnMomo(
    params: InitPaymentParams,
  ): Promise<InitPaymentResult> {
    const baseUrl = this.getEnv('MTN_MOMO_BASE_URL');
    const subscriptionKey = this.getEnv('MTN_MOMO_SUBSCRIPTION_KEY');
    const apiUser = this.getEnv('MTN_MOMO_API_USER');
    const apiKey = this.getEnv('MTN_MOMO_API_KEY');
    const targetEnv = process.env.MTN_MOMO_TARGET_ENV || 'sandbox';
    const callbackUrl =
      process.env.MTN_MOMO_CALLBACK_URL ||
      'http://localhost:3000/api/payments/webhook/mtn_momo';
    const referenceId = randomUUID();
    const payerPhone = this.extractPayerPhone(params.metadata);

    const tokenResponse = await fetch(`${baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString('base64')}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Target-Environment': targetEnv,
      },
    });

    if (!tokenResponse.ok) {
      throw new BadRequestException("Échec d'authentification MTN MoMo.");
    }

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
    };
    const accessToken = String(tokenPayload?.access_token || '').trim();
    if (!accessToken) {
      throw new BadRequestException('Token MTN MoMo invalide.');
    }

    const body = {
      amount: String(Math.round(params.amount)),
      currency: params.currency,
      externalId: String(params.orderId || referenceId),
      payer: {
        partyIdType: 'MSISDN',
        partyId: payerPhone,
      },
      payerMessage: "Paiement C'EMPIRE",
      payeeNote: `Commande ${params.orderId || ''}`.trim(),
    };

    const requestToPayResponse = await fetch(
      `${baseUrl}/collection/v1_0/requesttopay`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Reference-Id': referenceId,
          'X-Target-Environment': targetEnv,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
          'X-Callback-Url': callbackUrl,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    if (!requestToPayResponse.ok && requestToPayResponse.status !== 202) {
      throw new BadRequestException("Échec d'initialisation MTN MoMo.");
    }

    return {
      provider: PaymentProvider.MTN_MOMO,
      providerTransactionId: `mtn:${referenceId}`,
      instructions:
        'Demande envoyée sur votre numéro MTN. Confirmez le paiement dans votre wallet.',
      raw: body,
    };
  }

  private async verifyMtn(
    referenceId: string,
  ): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    const baseUrl = this.getEnv('MTN_MOMO_BASE_URL');
    const subscriptionKey = this.getEnv('MTN_MOMO_SUBSCRIPTION_KEY');
    const apiUser = this.getEnv('MTN_MOMO_API_USER');
    const apiKey = this.getEnv('MTN_MOMO_API_KEY');
    const targetEnv = process.env.MTN_MOMO_TARGET_ENV || 'sandbox';

    const tokenResponse = await fetch(`${baseUrl}/collection/token/`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${apiUser}:${apiKey}`).toString('base64')}`,
        'Ocp-Apim-Subscription-Key': subscriptionKey,
        'X-Target-Environment': targetEnv,
      },
    });
    if (!tokenResponse.ok) return 'PENDING';

    const tokenPayload = (await tokenResponse.json()) as {
      access_token?: string;
    };
    const accessToken = String(tokenPayload?.access_token || '').trim();
    if (!accessToken) return 'PENDING';

    const statusResponse = await fetch(
      `${baseUrl}/collection/v1_0/requesttopay/${encodeURIComponent(referenceId)}`,
      {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'X-Target-Environment': targetEnv,
          'Ocp-Apim-Subscription-Key': subscriptionKey,
        },
      },
    );

    if (!statusResponse.ok) return 'PENDING';
    const statusPayload = (await statusResponse.json()) as {
      status?: string;
    };
    const status = String(statusPayload?.status || '').toUpperCase();
    if (status === 'SUCCESSFUL') return 'SUCCESS';
    if (status === 'FAILED' || status === 'REJECTED') return 'FAILED';
    return 'PENDING';
  }

  private async initOrangeMoney(
    params: InitPaymentParams,
  ): Promise<InitPaymentResult> {
    const baseUrl = this.getEnv('ORANGE_OM_BASE_URL');
    const oauthPath = process.env.ORANGE_OM_OAUTH_PATH || '/oauth/v3/token';
    const webpayPath =
      process.env.ORANGE_OM_WEBPAY_PATH ||
      '/orange-money-webpay/dev/v1/webpayment';
    const clientId = this.getEnv('ORANGE_OM_CLIENT_ID');
    const clientSecret = this.getEnv('ORANGE_OM_CLIENT_SECRET');
    const merchantKey = this.getEnv('ORANGE_OM_MERCHANT_KEY');
    const orderId = `${params.orderId || 'order'}-${Date.now()}`;
    const returnUrl =
      process.env.ORANGE_OM_RETURN_URL ||
      'http://localhost:4200/payments/checkout?status=success';
    const cancelUrl =
      process.env.ORANGE_OM_CANCEL_URL ||
      'http://localhost:4200/payments/checkout?status=cancel';
    const notifUrl =
      process.env.ORANGE_OM_NOTIFY_URL ||
      'http://localhost:3000/api/payments/webhook/orange_money';

    const oauthResponse = await fetch(`${baseUrl}${oauthPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!oauthResponse.ok) {
      throw new BadRequestException("Échec d'authentification Orange Money.");
    }
    const oauthPayload = (await oauthResponse.json()) as {
      access_token?: string;
    };
    const accessToken = String(oauthPayload?.access_token || '').trim();
    if (!accessToken) {
      throw new BadRequestException('Token Orange Money invalide.');
    }

    const initBody = {
      merchant_key: merchantKey,
      currency: params.currency,
      order_id: orderId,
      amount: Math.round(params.amount),
      return_url: returnUrl,
      cancel_url: cancelUrl,
      notif_url: notifUrl,
      lang: 'fr',
      reference: String(params.orderId || orderId),
    };

    const webpayResponse = await fetch(`${baseUrl}${webpayPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(initBody),
    });

    const webpayPayload = (await webpayResponse.json().catch(() => null)) as
      | (JsonRecord & { payment_url?: string; pay_token?: string })
      | null;

    if (!webpayResponse.ok || !webpayPayload) {
      throw new BadRequestException("Échec d'initialisation Orange Money.");
    }

    const redirectUrl = pickString(
      webpayPayload.payment_url,
      webpayPayload['redirect_url'],
    );
    if (!redirectUrl) {
      throw new BadRequestException(
        'Orange Money a répondu sans URL de paiement.',
      );
    }

    return {
      provider: PaymentProvider.ORANGE_MONEY,
      providerTransactionId: `orange:${orderId}`,
      redirectUrl,
      instructions: 'Redirection vers Orange Money pour finaliser le paiement.',
      raw: {
        orderId,
        payToken: webpayPayload.pay_token,
      },
    };
  }

  private async verifyOrange(
    orderId: string,
  ): Promise<'SUCCESS' | 'FAILED' | 'PENDING'> {
    const baseUrl = this.getEnv('ORANGE_OM_BASE_URL');
    const oauthPath = process.env.ORANGE_OM_OAUTH_PATH || '/oauth/v3/token';
    const statusPath =
      process.env.ORANGE_OM_STATUS_PATH ||
      '/orange-money-webpay/dev/v1/transactionstatus';
    const clientId = this.getEnv('ORANGE_OM_CLIENT_ID');
    const clientSecret = this.getEnv('ORANGE_OM_CLIENT_SECRET');
    const merchantKey = this.getEnv('ORANGE_OM_MERCHANT_KEY');

    const oauthResponse = await fetch(`${baseUrl}${oauthPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
    });
    if (!oauthResponse.ok) return 'PENDING';
    const oauthPayload = (await oauthResponse.json()) as {
      access_token?: string;
    };
    const accessToken = String(oauthPayload?.access_token || '').trim();
    if (!accessToken) return 'PENDING';

    const statusResponse = await fetch(`${baseUrl}${statusPath}`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        merchant_key: merchantKey,
        order_id: orderId,
      }),
    });
    if (!statusResponse.ok) return 'PENDING';

    const statusPayload = (await statusResponse.json()) as JsonRecord;
    const rawStatus = pickString(
      statusPayload['status'],
      statusPayload['payment_status'],
      statusPayload['transaction_status'],
    ).toUpperCase();

    if (['SUCCESS', 'SUCCESSFUL', 'PAID', 'COMPLETED'].includes(rawStatus)) {
      return 'SUCCESS';
    }
    if (
      ['FAILED', 'CANCELED', 'CANCELLED', 'REJECTED', 'EXPIRED'].includes(
        rawStatus,
      )
    ) {
      return 'FAILED';
    }
    return 'PENDING';
  }

  private extractPayerPhone(metadata?: Record<string, unknown>): string {
    const billingInfo =
      (metadata?.billingInfo as Record<string, unknown>) || {};
    const raw = pickString(
      billingInfo.phone,
      metadata?.phone,
      metadata?.msisdn,
    );
    const cleaned = raw.replace(/[^\d]/g, '');
    if (!cleaned) {
      throw new BadRequestException(
        'Numéro client requis pour initier un paiement mobile money.',
      );
    }
    return cleaned;
  }

  private getEnv(key: string): string {
    const value = String(process.env[key] || '').trim();
    if (!value) {
      throw new BadRequestException(
        `Configuration manquante: variable ${key} requise.`,
      );
    }
    return value;
  }
}
