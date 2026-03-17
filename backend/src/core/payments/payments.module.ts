import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Payment } from './payment.entity';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';

import { CardPaymentProvider } from './providers/card.provider';
import { MobileMoneyProvider } from './providers/mobile-money.provider';
import { StripeProvider } from './providers/stripe.provider';
import { PaypalProvider } from './providers/paypal.provider';
import { WalletProvider } from './providers/wallet.provider';

import { OrderModule } from 'src/shop/order/order.module';
import { InvoicesModule } from 'src/core/invoices/invoices.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';
import { CexpressModule } from 'src/express/express.module';
import { EventBooking } from 'src/events/entities/event-booking.entity';

import { CCleanModule } from 'src/clean/clean.module';
import { TodoModule } from 'src/todo/todo.module';
import { GrillModule } from 'src/grill/grill.module';
import { CshopModule } from 'src/shop/shop.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Payment, EventBooking]),
    forwardRef(() => InvoicesModule),
    NotificationsModule,
    forwardRef(() => OrderModule),
    forwardRef(() => CCleanModule),
    forwardRef(() => TodoModule),
    forwardRef(() => GrillModule),
    forwardRef(() => CexpressModule),
    forwardRef(() => CshopModule),
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
