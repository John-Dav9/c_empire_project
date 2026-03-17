import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { PricingService } from '../services/pricing.service';

@Controller('c-express/public')
export class PublicExpressController {
  constructor(private readonly pricingService: PricingService) {}

  @Public()
  @Get('services')
  getPublicServices() {
    const estimate = (distanceKm: number, weightKg: number, urgencyLevel = 1) =>
      this.pricingService.calculateDeliveryPrice({
        distanceKm,
        weightKg,
        urgencyLevel,
      });

    return [
      {
        id: 'express-standard',
        title: 'Livraison Standard',
        description: 'Expedition fiable pour documents et colis quotidiens.',
        eta: '2h-4h',
        baseEstimate: estimate(8, 2, 1),
        currency: 'XAF',
      },
      {
        id: 'express-urgent',
        title: 'Livraison Urgente',
        description: 'Priorite maximale pour vos envois critiques.',
        eta: '45min-90min',
        baseEstimate: estimate(6, 1, 2),
        currency: 'XAF',
      },
      {
        id: 'express-bulk',
        title: 'Livraison Colis Lourd',
        description: 'Transport adapte aux paquets volumineux et fragiles.',
        eta: '3h-6h',
        baseEstimate: estimate(10, 8, 1),
        currency: 'XAF',
      },
      {
        id: 'express-import-export',
        title: 'Import / Export',
        description:
          'Accompagnement logistique pour flux nationaux et internationaux.',
        eta: '24h+',
        baseEstimate: estimate(20, 12, 1),
        currency: 'XAF',
      },
    ];
  }
}
