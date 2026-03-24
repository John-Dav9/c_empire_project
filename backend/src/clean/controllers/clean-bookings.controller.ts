import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
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
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

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

  // POST /cclean/bookings/:id/pay
  @UseGuards(JwtAuthGuard)
  @Post(':id/pay')
  async payBooking(
    @Param('id') bookingId: string,
    @Body() body: { provider: PaymentProvider },
    @CurrentUser('userId') userId: string,
  ) {
    const booking = await this.service.findOne(bookingId);

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
