import { Module } from '@nestjs/common';
import { CshopController } from './shop.controller';
import { ProductModule } from './product/product.module';
import { CartModule } from './cart/cart.module';
import { OrderModule } from './order/order.module';
import { ReviewModule } from './review/review.module';
import { PromotionModule } from './promotion/promotion.module';
import { RelayPointModule } from './relay-point/relay-point.module';

@Module({
  imports: [
    ProductModule,
    CartModule,
    OrderModule,
    ReviewModule,
    PromotionModule,
    RelayPointModule,
  ],
  controllers: [CshopController],
  providers: [],
  exports: [OrderModule], // ✅ pour que PaymentsModule puisse accéder à OrderService
})
export class CshopModule {}
