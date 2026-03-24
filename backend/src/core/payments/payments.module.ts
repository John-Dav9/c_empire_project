import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { CardPaymentProvider } from './providers/card.provider';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PaypalProvider } from './providers/paypal.provider';
import { WalletProvider } from './providers/wallet.provider';

import { InvoicesModule } from 'src/core/invoices/invoices.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';

// Entités importées directement (pas via leurs modules, évite les circular deps)
import { Order } from 'src/shop/order/order.entity';
import { EventBooking } from 'src/events/entities/event-booking.entity';
import { CleanBooking } from 'src/clean/entities/clean-booking.entity';
import { TodoOrder } from 'src/todo/entities/todo-order.entity';
import { GrillOrder } from 'src/grill/entities/grill-order.entity';
import { DeliveryEntity } from 'src/express/entities/delivery.entity';
import { ImportExportEntity } from 'src/express/entities/import-export.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Payment,
      Order,
      EventBooking,
      CleanBooking,
      TodoOrder,
      GrillOrder,
      DeliveryEntity,
      ImportExportEntity,
    ]),
    InvoicesModule,
    NotificationsModule,
  ],
  controllers: [PaymentsController],
  providers: [
    PaymentsService,
    MobileMoneyProvider,
    CardPaymentProvider,
    StripeProvider,
    PaypalProvider,
    WalletProvider,
  ],
  exports: [PaymentsService],
})
export class PaymentsModule {}
