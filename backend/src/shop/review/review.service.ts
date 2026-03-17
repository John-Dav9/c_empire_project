import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Review } from './review.entity';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(Review)
    private readonly reviewRepo: Repository<Review>,
  ) {}

  async create(userId: string, dto: CreateReviewDto): Promise<Review> {
    // Empêche double avis (sécurité supplémentaire en plus de l'index unique)
    const exists = await this.reviewRepo.findOne({
      where: { userId, productId: dto.productId },
    });

    if (exists) {
      throw new BadRequestException('You already reviewed this product');
    }

    const review = this.reviewRepo.create({
      userId,
      productId: dto.productId,
      rating: dto.rating,
      comment: dto.comment,
      isVisible: true,
    });

    return this.reviewRepo.save(review);
  }

  async findByProduct(productId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { productId, isVisible: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findUserReviews(userId: string): Promise<Review[]> {
    return this.reviewRepo.find({
      where: { userId },
      order: { createdAt: 'DESC' },
    });
  }

  async update(
    userId: string,
    id: string,
    dto: UpdateReviewDto,
  ): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId !== userId) {
      throw new BadRequestException('You can only update your own review');
    }

    const updated = this.reviewRepo.merge(review, dto);
    return this.reviewRepo.save(updated);
  }

  async remove(userId: string, id: string): Promise<{ deleted: boolean }> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    if (review.userId !== userId) {
      throw new BadRequestException('You can only delete your own review');
    }

    await this.reviewRepo.remove(review);
    return { deleted: true };
  }

  // Admin: modération
  async setVisibility(id: string, isVisible: boolean): Promise<Review> {
    const review = await this.reviewRepo.findOne({ where: { id } });
    if (!review) throw new NotFoundException('Review not found');

    review.isVisible = isVisible;
    return this.reviewRepo.save(review);
  }
}
