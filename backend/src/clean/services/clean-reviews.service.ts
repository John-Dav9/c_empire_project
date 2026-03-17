import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CreateCleanReviewDto } from '../dto/create-clean-review.dto';
import { UpdateCleanReviewStatusDto } from '../dto/update-clean-review-status.dto';
import { CleanReview } from '../entities/clean-review.entity';
import { CleanReviewStatus } from '../enums/clean-review-status.enum';

import { CleanBookingsService } from '../services/clean-bookings.service';
import { CleanBookingStatus } from '../enums/clean-booking-status.enum';

@Injectable()
export class CleanReviewsService {
  constructor(
    @InjectRepository(CleanReview)
    private readonly repo: Repository<CleanReview>,
    private readonly cleanBookingsService: CleanBookingsService,
  ) {}

  async create(dto: CreateCleanReviewDto) {
    const booking = await this.cleanBookingsService.findOne(dto.bookingId);

    // ✅ on autorise avis uniquement si booking payé/confirmé ou DONE
    if (
      ![CleanBookingStatus.CONFIRMED, CleanBookingStatus.DONE].includes(
        booking.status,
      )
    ) {
      throw new BadRequestException(
        'You can review only after payment / completion',
      );
    }

    // ✅ cohérence email
    if (booking.email !== dto.email) {
      throw new BadRequestException('Email must match the booking email');
    }

    const review = this.repo.create({
      bookingId: dto.bookingId,
      cleanServiceId: dto.cleanServiceId ?? booking.cleanServiceId,
      fullName: dto.fullName,
      email: dto.email,
      rating: dto.rating,
      comment: dto.comment,
      status: CleanReviewStatus.PENDING,
    });

    return this.repo.save(review);
  }

  async findPublicApproved() {
    return this.repo.find({
      where: { status: CleanReviewStatus.APPROVED },
      order: { createdAt: 'DESC' },
    });
  }

  async findAllAdmin() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const review = await this.repo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('CLEAN_REVIEW_NOT_FOUND');
    return review;
  }

  async updateStatus(id: string, dto: UpdateCleanReviewStatusDto) {
    const review = await this.findOne(id);
    review.status = dto.status;
    return this.repo.save(review);
  }

  async remove(id: string) {
    const review = await this.findOne(id);
    await this.repo.remove(review);
    return { deleted: true };
  }
}
