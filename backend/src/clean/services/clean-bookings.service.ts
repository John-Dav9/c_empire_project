import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentProvider } from 'src/core/payments/providers/payment-provider.enum';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';
import { CreateCleanBookingDto } from '../dto/create-clean-booking.dto';
import { UpdateCleanBookingStatusDto } from '../dto/update-clean-booking-status.dto';
import { CleanBooking } from '../entities/clean-booking.entity';
import { CleanBookingStatus } from '../enums/clean-booking-status.enum';
import { PaymentSuccessEvent } from 'src/core/payments/events/payment-success.event';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';

@Injectable()
export class CleanBookingsService {
  private readonly logger = new Logger(CleanBookingsService.name);

  constructor(
    @InjectRepository(CleanBooking)
    private readonly repo: Repository<CleanBooking>,
  ) {}

  async create(dto: CreateCleanBookingDto) {
    const booking = this.repo.create({
      ...dto,
      currency: dto.currency ?? 'EUR',
      status: CleanBookingStatus.DRAFT,
    });
    return this.repo.save(booking);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const booking = await this.repo.findOne({ where: { id } });
    if (!booking) throw new NotFoundException('CLEAN_BOOKING_NOT_FOUND');
    return booking;
  }

  async updateStatus(id: string, dto: UpdateCleanBookingStatusDto) {
    const booking = await this.findOne(id);
    booking.status = dto.status;
    if (dto.assignedTo !== undefined) booking.assignedTo = dto.assignedTo;
    if (dto.notes !== undefined) booking.notes = dto.notes;
    return this.repo.save(booking);
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    if (event.referenceType !== PaymentReferenceType.CLEAN_BOOKING) return;
    try {
      await this.markPaid(event.referenceId, event.paymentId, event.provider);
    } catch (err) {
      this.logger.error(
        `Erreur gestion paiement CLEAN_BOOKING ${event.referenceId}`,
        err,
      );
    }
  }

  async markPaid(bookingId: string, paymentId: string, provider?: string) {
    const booking = await this.findOne(bookingId);

    booking.paymentId = paymentId;
    if (provider) booking.paymentProvider = provider;

    booking.status = CleanBookingStatus.CONFIRMED;
    booking.paidAt = new Date().toISOString();

    return this.repo.save(booking);
  }
}
