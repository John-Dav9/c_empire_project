import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OnEvent } from '@nestjs/event-emitter';

import { Event } from '../entities/event.entity';
import { EventBooking } from '../entities/event-booking.entity';
import { EventBookingStatus } from '../enums/event-booking-status.enum';

import { CreateEventBookingDto } from '../dto/create-booking.dto';
import { UpdateEventBookingDto } from '../dto/update-booking.dto';

import { User } from 'src/auth/entities/user.entity';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';
import { PaymentsService } from 'src/core/payments/payments.service';
import { PaymentSuccessEvent } from 'src/core/payments/events/payment-success.event';

@Injectable()
export class EventBookingService {
  private readonly logger = new Logger(EventBookingService.name);

  constructor(
    @InjectRepository(Event)
    private readonly eventRepository: Repository<Event>,

    @InjectRepository(EventBooking)
    private readonly bookingRepository: Repository<EventBooking>,

    private readonly paymentsService: PaymentsService,
  ) {}

  async createBooking(
    user: User,
    dto: CreateEventBookingDto,
  ): Promise<{
    booking: EventBooking;
    payment: Awaited<ReturnType<PaymentsService['initPayment']>>;
  }> {
    const event = await this.eventRepository.findOne({
      where: { id: dto.eventId, isActive: true },
    });

    if (!event) throw new NotFoundException('Event not found or inactive');

    const totalAmount = Number(event.basePrice);
    if (!Number.isFinite(totalAmount) || totalAmount < 0) {
      throw new BadRequestException('Invalid event price');
    }

    const booking = this.bookingRepository.create({
      user,
      event,
      eventDate: new Date(dto.eventDate),
      location: dto.location,
      options: dto.options ?? {},
      totalAmount,
      status: EventBookingStatus.PENDING,
    });

    const savedBooking = await this.bookingRepository.save(booking);

    // ✅ 1) initPayment (retourne un objet init, PAS l'entity Payment)
    const paymentInit = await this.paymentsService.initPayment({
      userId: user.id,
      referenceType: PaymentReferenceType.EVENT_BOOKING,
      referenceId: savedBooking.id,
      currency: 'XAF',
      provider: dto.paymentProvider,
      metadata: {
        eventId: event.id,
        eventTitle: event.title,
      },
    });

    // ✅ 2) récupérer l'entity Payment et l'attacher
    const paymentEntity = await this.paymentsService.findById(
      paymentInit.paymentId,
    );

    savedBooking.payment = paymentEntity;
    const savedWithPayment = await this.bookingRepository.save(savedBooking);

    return {
      booking: savedWithPayment,
      payment: paymentInit,
    };
  }

  async updateBooking(
    user: User,
    bookingId: string,
    dto: UpdateEventBookingDto,
  ): Promise<EventBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'event', 'payment'],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user.id !== user.id)
      throw new ForbiddenException('Access denied');

    if (booking.status !== EventBookingStatus.PENDING) {
      throw new BadRequestException('You can only edit a PENDING booking');
    }

    if (dto.eventDate) booking.eventDate = new Date(dto.eventDate);
    if (dto.location) booking.location = dto.location;
    if (dto.options !== undefined) booking.options = dto.options;

    return this.bookingRepository.save(booking);
  }

  async cancelBooking(user: User, bookingId: string): Promise<EventBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'event', 'payment'],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.user.id !== user.id)
      throw new ForbiddenException('Access denied');

    if (booking.status !== EventBookingStatus.PENDING) {
      throw new BadRequestException('You can only cancel a PENDING booking');
    }

    booking.status = EventBookingStatus.CANCELLED;
    return this.bookingRepository.save(booking);
  }

  async validateBooking(bookingId: string): Promise<EventBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'event', 'payment'],
    });

    if (!booking) throw new NotFoundException('Booking not found');

    if (
      booking.status === EventBookingStatus.CANCELLED ||
      booking.status === EventBookingStatus.REFUSED
    ) {
      throw new BadRequestException('This booking cannot be validated');
    }

    booking.status = EventBookingStatus.VALIDATED;
    return this.bookingRepository.save(booking);
  }

  async refuseBooking(bookingId: string): Promise<EventBooking> {
    const booking = await this.bookingRepository.findOne({
      where: { id: bookingId },
      relations: ['user', 'event', 'payment'],
    });

    if (!booking) throw new NotFoundException('Booking not found');
    if (booking.status === EventBookingStatus.CANCELLED) {
      throw new BadRequestException('Cannot refuse a cancelled booking');
    }

    booking.status = EventBookingStatus.REFUSED;
    return this.bookingRepository.save(booking);
  }

  async findMyBookings(user: User): Promise<EventBooking[]> {
    return this.bookingRepository.find({
      where: { user: { id: user.id } },
      relations: ['event', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  async findAllBookings(): Promise<EventBooking[]> {
    return this.bookingRepository.find({
      relations: ['user', 'event', 'payment'],
      order: { createdAt: 'DESC' },
    });
  }

  @OnEvent('payment.success')
  async handlePaymentSuccess(event: PaymentSuccessEvent): Promise<void> {
    if (event.referenceType !== PaymentReferenceType.EVENT_BOOKING) return;
    try {
      const booking = await this.bookingRepository.findOne({
        where: { id: event.referenceId },
      });
      if (!booking || booking.status !== EventBookingStatus.PENDING) return;
      booking.status = EventBookingStatus.PAID;
      await this.bookingRepository.save(booking);
    } catch (err) {
      this.logger.error(`Erreur gestion paiement EVENT_BOOKING ${event.referenceId}`, err);
    }
  }
}
