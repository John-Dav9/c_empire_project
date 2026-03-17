// src/core/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Notification } from './notification.entity';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { SmsProvider } from './sms/sms.provider';
import { WhatsappProvider } from './whatsapp/whatsapp.provider';
import { EmailModule } from './email/email.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    EmailModule, // pour EmailService
  ],
  providers: [NotificationsService, SmsProvider, WhatsappProvider],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
