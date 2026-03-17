import { Body, Controller, Post, Req, UseGuards } from '@nestjs/common';
import type { Request } from 'express';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { DeliveryService } from '../services/delivery.service';
import { PaymentsService } from 'src/core/payments/payments.service';
import { CreateDeliveryPaymentDto } from '../dto/create-delivery-payment.dto';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';

// ⚠️ adapte l’import selon ton module payment

type AuthRequest = Request & { user: { id: string } };

@Controller('c-express/payments')
@UseGuards(JwtAuthGuard)
export class DeliveryPaymentController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly paymentService: PaymentsService,
  ) {}

  /**
   * USER - Initier le paiement d’une livraison
   * POST /c-express/payments/delivery
   */
  @Post('delivery')
  async payDelivery(
    @Req() req: AuthRequest,
    @Body() dto: CreateDeliveryPaymentDto,
  ) {
    const userId = this.extractUserId(req);

    // sécurité: l’utilisateur ne paie que sa livraison
    const delivery = await this.deliveryService.findOneForUserOrFail(
      userId,
      dto.deliveryId,
    );

    if (delivery.paid) {
      return { ok: true, message: 'Already paid', deliveryId: delivery.id };
    }

    // On crée une transaction chez PaymentModule
    // ⚠️ adapte la signature selon ton PaymentService réel
    const payment = await this.paymentService.createPaymentIntent({
      userId,
      referenceType: PaymentReferenceType.EXPRESS_DELIVERY,
      referenceId: delivery.id,
      currency: 'XAF',
      provider: dto.provider,
      metadata: {
        sector: 'CEXPRESS',
        type: 'EXPRESS_DELIVERY',
        deliveryId: delivery.id,
        amount: delivery.price,
      },
    });

    return {
      ok: true,
      deliveryId: delivery.id,
      amount: delivery.price,
      payment,
    };
  }

  private extractUserId(req: AuthRequest): string {
    return (
      (req as any)?.user?.id ??
      (req as any)?.user?.userId ??
      (req as any)?.user?.sub
    );
  }
}
