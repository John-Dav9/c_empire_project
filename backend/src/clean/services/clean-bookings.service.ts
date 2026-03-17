import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { PaymentProvider } from 'src/core/payments/providers/payment-provider.enum';
import { Repository } from 'typeorm';
import { CreateCleanBookingDto } from '../dto/create-clean-booking.dto';
import { UpdateCleanBookingStatusDto } from '../dto/update-clean-booking-status.dto';
import { CleanBooking } from '../entities/clean-booking.entity';
import { CleanBookingStatus } from '../enums/clean-booking-status.enum';

// ✅ Connexion au paiement global

@Injectable()
export class CleanBookingsService {
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

  /**
   * ✅ Appelé par webhook / callback après paiement confirmé
   * (ou par ton PaymentsService via un hook interne)
   */
  async markPaid(bookingId: string, paymentId: string, provider?: string) {
    const booking = await this.findOne(bookingId);

    booking.paymentId = paymentId;
    if (provider) booking.paymentProvider = provider;

    booking.status = CleanBookingStatus.CONFIRMED;
    booking.paidAt = new Date().toISOString();

    return this.repo.save(booking);
  }
}
