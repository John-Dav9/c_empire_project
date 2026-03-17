// src/core/payments/payments.controller.ts

import {
  BadRequestException,
  Body,
  Controller,
  Headers,
  Param,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentsService } from './payments.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { InitPaymentDto } from './dto/init-payment.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';
import { Permissions } from '../permissions/permissions.decorator';

@Controller('payments')
@UseGuards(JwtAuthGuard)
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('init')
  @Permissions('payments:own:init')
  async initPayment(
    @Body() body: InitPaymentDto,
    @Req() req: AuthenticatedRequest,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    return this.paymentsService.initPayment({
      userId,
      referenceType: body.referenceType,
      referenceId: body.referenceId,
      currency: body.currency,
      provider: body.provider,
      metadata: body.metadata,
    });
  }

  @Post('verify')
  @Permissions('payments:own:verify')
  async verifyPayment(
    @Body()
    body: {
      providerTransactionId?: string;
      transactionId?: string;
    },
  ) {
    const id = body.providerTransactionId ?? body.transactionId;
    if (!id) {
      throw new BadRequestException('providerTransactionId is required');
    }
    return this.paymentsService.verify(id);
  }

  // webhook / callback provider
  @Public()
  @Post('webhook/:provider')
  async webhook(
    @Param('provider') provider: string,
    @Body() payload: Record<string, unknown>,
    @Headers() headers: Record<string, string | string[] | undefined>,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.paymentsService.handleWebhook(
      provider,
      payload,
      headers,
      req.rawBody,
    );
  }
}
