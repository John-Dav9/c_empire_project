import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CexpressService } from './express.service';

// Controllers
import { DeliveryController } from './controllers/delivery.controller';
import { ImportExportController } from './controllers/import-export.controller';
import { AdminExpressController } from './controllers/admin-express.controller';
import { AdminCourierController } from './controllers/admin-courier.controller';
import { PublicExpressController } from './controllers/public-express.controller';
import { DeliveryPaymentController } from './controllers/delivery-payment.controller';
import { AdminImportExportController } from './controllers/admin-import-export.controller';

// Services
import { DeliveryService } from './services/delivery.service';
import { ImportExportService } from './services/import-export.service';
import { PricingService } from './services/pricing.service';
import { CourierService } from './services/courier.service';

// Entities
import { ImportExportEntity } from './entities/import-export.entity';
import { CourierEntity } from './entities/courier.entity';
import { DeliveryEntity } from './entities/delivery.entity';

// Modules globaux (si existants)
import { PaymentsModule } from 'src/core/payments/payments.module';
import { NotificationsModule } from 'src/core/notifications/notifications.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      DeliveryEntity,
      ImportExportEntity,
      CourierEntity,
    ]),

    // Garde le pattern global utilisé dans le projet
    forwardRef(() => PaymentsModule),
    forwardRef(() => NotificationsModule),
  ],

  controllers: [
    DeliveryController,
    ImportExportController,
    AdminExpressController,
    AdminCourierController,
    AdminImportExportController,
    PublicExpressController,
    DeliveryPaymentController,
  ],

  providers: [
    // Service principal déjà existant
    CexpressService,

    // Services métier C'EXPRESS
    DeliveryService,
    ImportExportService,
    PricingService,
    CourierService,
  ],

  exports: [
    // On conserve l’export existant
    CexpressService,

    // Exports utiles pour d'autres modules (admin, stats, paiement)
    DeliveryService,
    ImportExportService,
    PricingService,
    TypeOrmModule,
  ],
})
export class CexpressModule {}
