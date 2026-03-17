import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from './product.entity';
import { ProductService } from './product.service';
import { ProductController } from './product.controller';
import { PromotionModule } from '../promotion/promotion.module';
import { ReviewModule } from '../review/review.module';
import { Review } from '../review/review.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([Product, Review]),
    PromotionModule,
    ReviewModule,
  ],
  controllers: [ProductController],
  providers: [ProductService],
  exports: [ProductService],
})
export class ProductModule {}
