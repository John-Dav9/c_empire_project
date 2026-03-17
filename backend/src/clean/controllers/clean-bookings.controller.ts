import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { PaymentProvider } from 'src/core/payments/providers/payment-provider.enum';
import { CreateCleanBookingDto } from '../dto/create-clean-booking.dto';
import { UpdateCleanBookingStatusDto } from '../dto/update-clean-booking-status.dto';
import { CleanBookingsService } from '../services/clean-bookings.service';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';
import { PaymentsService } from 'src/core/payments/payments.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';
import { Permissions } from 'src/core/permissions/permissions.decorator';

@Controller('cclean/bookings')
export class CleanBookingsController {
  constructor(
    private readonly service: CleanBookingsService,
    private readonly paymentsService: PaymentsService,
  ) {}

  // Public: créer une réservation
  @Post()
  create(@Body() dto: CreateCleanBookingDto) {
    return this.service.create(dto);
  }

  // Admin: lister + consulter
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('clean:bookings:read')
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Admin: changer statut / assigner
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('clean:bookings:update')
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCleanBookingStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  // ✅ Public: init paiement (provider en query)
  // ex: POST /cclean/bookings/:id/pay?provider=STRIPE
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay')
  async payBooking(
    @Param('id') bookingId: string,
    @Body() body: { provider: PaymentProvider },
    @Req() req: AuthenticatedRequest,
  ) {
    const booking = await this.service.findOne(bookingId);
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;

    // (optionnel) bloquer si déjà payé/annulé
    // tu peux garder ta logique ici

    // on passe au module paiement global
    return this.paymentsService.initPayment({
      userId,
      currency: booking.currency,
      provider: body.provider,
      referenceId: booking.id,
      referenceType: PaymentReferenceType.CLEAN_BOOKING,
      metadata: {
        sector: 'CLEAN',
        description: `C'CLEAN booking ${booking.id} - ${booking.serviceTitle}`,
      },
    });
  }
}
