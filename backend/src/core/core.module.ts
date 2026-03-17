// src/core/core.module.ts
import { Module } from '@nestjs/common';
import { EmailModule } from './notifications/email/email.module';
import { NotificationsModule } from './notifications/notifications.module';
import { RolesModule } from './roles/roles.module';
import { PaymentsModule } from './payments/payments.module';

@Module({
  imports: [RolesModule, EmailModule, NotificationsModule, PaymentsModule],
  exports: [RolesModule, EmailModule, NotificationsModule, PaymentsModule],
})
export class CoreModule {}
