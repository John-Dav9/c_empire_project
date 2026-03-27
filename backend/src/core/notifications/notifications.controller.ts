import { Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('notifications')
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @UseGuards(JwtAuthGuard)
  @Get('me')
  async getMyNotifications(@CurrentUser('userId') userId: string) {
    return this.notificationsService.getUserNotifications(userId);
  }

  @UseGuards(JwtAuthGuard)
  @Patch('mark-all-read')
  async markAllRead(@CurrentUser('userId') userId: string) {
    return this.notificationsService.markAllRead(userId);
  }
}
