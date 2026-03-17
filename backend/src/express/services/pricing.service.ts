import { Injectable } from '@nestjs/common';

@Injectable()
export class PricingService {
  /**
   * Configuration de base
   * (plus tard → table DB ou fichier config)
   */
  private readonly BASE_PRICE = 5; // prix de départ
  private readonly PRICE_PER_KM = 1.2; // €/km
  private readonly PRICE_PER_KG = 0.8; // €/kg

  /**
   * Multiplicateurs d'urgence
   */
  private readonly URGENCY_MULTIPLIER = {
    1: 1, // normal
    2: 1.5, // urgent
    3: 2.2, // très urgent
  };

  /**
   * Calcul du prix final
   */
  calculateDeliveryPrice(params: {
    distanceKm?: number;
    weightKg?: number;
    urgencyLevel?: number;
  }): number {
    const distanceKm = params.distanceKm ?? 0;
    const weightKg = params.weightKg ?? 0;
    const urgencyLevel = params.urgencyLevel ?? 1;

    const distanceCost = distanceKm * this.PRICE_PER_KM;
    const weightCost = weightKg * this.PRICE_PER_KG;

    const baseTotal = this.BASE_PRICE + distanceCost + weightCost;

    const multiplier = this.URGENCY_MULTIPLIER[urgencyLevel] ?? 1;

    const finalPrice = baseTotal * multiplier;

    // Arrondi à 2 décimales
    return Math.round(finalPrice * 100) / 100;
  }
}
