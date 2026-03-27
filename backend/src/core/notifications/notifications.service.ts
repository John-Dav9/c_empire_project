// src/core/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationChannel } from './notification.entity';
import { SmsProvider } from './sms/sms.provider';
import { WhatsappProvider } from './whatsapp/whatsapp.provider';
import { EmailService } from './email/email.service';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private readonly notificationRepo: Repository<Notification>,
    private readonly emailService: EmailService,
    private readonly smsProvider: SmsProvider,
    private readonly whatsappProvider: WhatsappProvider,
  ) {}

  // Notification générique (enregistre + envoie selon channel)
  async sendNotification(options: {
    userId?: string;
    to?: string; // email / téléphone selon canal
    title: string;
    message: string;
    channel: NotificationChannel;
  }) {
    const userRef = options.userId
      ? ({ id: options.userId } as Notification['user'])
      : undefined;
    const notification = this.notificationRepo.create({
      user: userRef,
      title: options.title,
      message: options.message,
      channel: options.channel,
      status: 'PENDING',
    });

    await this.notificationRepo.save(notification);

    try {
      switch (options.channel) {
        case 'EMAIL':
          if (!options.to) throw new Error('Missing email');
          await this.emailService.sendNotificationEmail(
            options.to,
            options.title,
            options.message,
          );
          break;

        case 'SMS':
          if (!options.to) throw new Error('Missing phone number');
          await this.smsProvider.send(options.to, options.message);
          break;

        case 'WHATSAPP':
          if (!options.to) throw new Error('Missing phone number');
          await this.whatsappProvider.send(options.to, options.message);

          break;

        case 'IN_APP':
          // Rien à envoyer, juste stocker → à lire dans le frontend
          break;
      }

      notification.status = 'SENT';
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      console.error('Notification error:', message);
      notification.status = 'FAILED';
    }

    await this.notificationRepo.save(notification);
    return notification;
  }

  // Notifications d'un utilisateur (pour "centre de notifications" dans le front)
  async getUserNotifications(userId: string) {
    return this.notificationRepo.find({
      where: { user: { id: userId } },
      order: { createdAt: 'DESC' },
      take: 30,
    });
  }

  async markAllRead(userId: string) {
    await this.notificationRepo.update(
      { user: { id: userId }, isRead: false },
      { isRead: true },
    );
    return { success: true };
  }
}
