import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { DeliveryService } from '../services/delivery.service';
import { PaymentsService } from 'src/core/payments/payments.service';
import { CreateDeliveryPaymentDto } from '../dto/create-delivery-payment.dto';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('c-express/payments')
@UseGuards(JwtAuthGuard)
export class DeliveryPaymentController {
  constructor(
    private readonly deliveryService: DeliveryService,
    private readonly paymentService: PaymentsService,
  ) {}

  /**
   * USER - Initier le paiement d'une livraison
   * POST /c-express/payments/delivery
   */
  @Post('delivery')
  async payDelivery(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDeliveryPaymentDto,
  ) {
    const delivery = await this.deliveryService.findOneForUserOrFail(
      userId,
      dto.deliveryId,
    );

    if (delivery.paid) {
      return { ok: true, message: 'Already paid', deliveryId: delivery.id };
    }

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
}
