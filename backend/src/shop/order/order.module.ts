import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Order } from './order.entity';
import { OrderItem } from './order-item.entity';
import { Cart } from '../cart/cart.entity';
import { CartItem } from '../cart/cart-item.entity';
import { User } from '../../auth/entities/user.entity';
import { OrderController } from './order.controller';
import { OrderService } from './order.service';
import { CexpressModule } from 'src/express/express.module';
import { PromotionModule } from '../promotion/promotion.module';
import { ProductModule } from '../product/product.module';
import { RelayPointModule } from '../relay-point/relay-point.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Order, OrderItem, Cart, CartItem, User]),
    CexpressModule,
    PromotionModule,
    ProductModule,
    RelayPointModule,
    NotificationsModule,
  ],
  providers: [OrderService],
  controllers: [OrderController],
  exports: [OrderService],
})
export class OrderModule {}
