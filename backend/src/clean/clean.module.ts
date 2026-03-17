import { forwardRef, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CleanServiceEntity } from './entities/clean-service.entity';
import { CleanQuote } from './entities/clean-quote.entity';
import { CleanBooking } from './entities/clean-booking.entity';
import { CleanReview } from './entities/clean-review.entity';

import { CleanQuotesService } from './services/clean-quotes.service';
import { CleanServicesService } from './services/clean-services.service';
import { CleanBookingsService } from './services/clean-bookings.service';
import { CleanReviewsService } from './services/clean-reviews.service';

import { CleanServicesController } from './controllers/clean-services.controller';
import { CleanQuotesController } from './controllers/clean-quotes.controller';
import { CleanBookingsController } from './controllers/clean-bookings.controller';
import { CleanReviewsController } from './controllers/clean-reviews.controller';
import { PaymentsModule } from 'src/core/payments/payments.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CleanServiceEntity,
      CleanQuote,
      CleanBooking,
      CleanReview,
    ]),
    forwardRef(() => PaymentsModule),
  ],
  controllers: [
    CleanServicesController,
    CleanQuotesController,
    CleanBookingsController,
    CleanReviewsController,
  ],
  providers: [
    CleanServicesService,
    CleanQuotesService,
    CleanBookingsService,
    CleanReviewsService,
  ],
  exports: [
    CleanServicesService,
    CleanQuotesService,
    CleanBookingsService,
    CleanReviewsService,
  ],
})
export class CCleanModule {}
