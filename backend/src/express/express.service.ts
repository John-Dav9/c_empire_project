import { Injectable, ServiceUnavailableException } from '@nestjs/common';

@Injectable()
export class CexpressService {
  private get providerMode(): string {
    return String(process.env.CEXPRESS_PROVIDER || 'disabled')
      .trim()
      .toLowerCase();
  }

  private assertProviderAvailable(action: string) {
    if (this.providerMode === 'mock') {
      return;
    }

    if (this.providerMode === 'disabled') {
      throw new ServiceUnavailableException(
        `C'EXPRESS est desactive. Impossible de ${action}.`,
      );
    }

    throw new ServiceUnavailableException(
      `C'EXPRESS live n'est pas encore implemente. Impossible de ${action}.`,
    );
  }

  async quoteDelivery(payload: {
    deliveryAddress?: string;
    orderTotal: number;
  }) {
    this.assertProviderAvailable('calculer un tarif de livraison');

    const fee = payload.deliveryAddress ? 2500 : 0;
    return { fee, currency: 'XAF' };
  }

  async createDelivery(payload: {
    orderId: string;
    pickup?: string;
    dropoff: string;
    contactPhone?: string;
    amountToCollect?: number;
  }) {
    this.assertProviderAvailable('creer une livraison');

    return {
      deliveryId: `cex_${payload.orderId}_${Date.now()}`,
      status: 'assigned',
    };
  }
}
