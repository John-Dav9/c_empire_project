import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CEventController } from './controllers/event.controller';
import { EventBookingController } from './controllers/event-booking.controller';

import { CEventService } from './services/event.service';
import { EventBookingService } from './services/event-booking.service';
import { EventAiService } from './services/event-ai.service';

import { Event } from './entities/event.entity';
import { EventBooking } from './entities/event-booking.entity';

import { PaymentsModule } from 'src/core/payments/payments.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Event, EventBooking]),
    PaymentsModule,
    NotificationsModule,
  ],
  controllers: [CEventController, EventBookingController],
  providers: [CEventService, EventBookingService, EventAiService],
  exports: [CEventService, EventBookingService],
})
export class CEventModule {}
