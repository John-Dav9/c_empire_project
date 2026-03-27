import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { GrillProduct } from './entities/grill-product.entity';
import { GrillOrder } from './entities/grill-order.entity';
import { GrillOrderItem } from './entities/grill-order-item.entity';

import { GrillProductsService } from './services/grill-products.service';
import { GrillOrdersService } from './services/grill-orders.service';

import { GrillProductsController } from './controllers/grill-products.controller';
import { GrillOrdersController } from './controllers/grill-orders.controller';
import { GrillMenuPackItem } from './entities/grill-menu-pack-item.entity';
import { GrillMenuPack } from './entities/grill-menu-pack.entity';
import { GrillMenuPacksController } from './controllers/grill-menu-packs.controller';
import { GrillMenuPacksService } from './services/grill-menu-packs.service';
import { PaymentsModule } from 'src/core/payments/payments.module';
import { CexpressModule } from 'src/express/express.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      GrillProduct,
      GrillOrder,
      GrillOrderItem,
      GrillMenuPack,
      GrillMenuPackItem,
    ]),
    PaymentsModule,
    CexpressModule,
    NotificationsModule,
  ],
  controllers: [
    GrillProductsController,
    GrillOrdersController,
    GrillMenuPacksController,
  ],
  providers: [GrillProductsService, GrillOrdersService, GrillMenuPacksService],
  exports: [GrillOrdersService, GrillProductsService], // utile pour PaymentsService
})
export class GrillModule {}
