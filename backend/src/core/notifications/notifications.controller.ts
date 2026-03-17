// src/core/notifications/notifications.controller.ts
import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  // Récupérer mes notifications (utilisateur connecté)
  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyNotifications(@Req() req) {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    return this.notificationsService.getUserNotifications(userId);
  }
}
