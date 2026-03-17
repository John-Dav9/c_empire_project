import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';

import { DeliveryService } from '../services/delivery.service';
import { DeliveryStatus } from '../enums/delivery-status.enum';

import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';

@Controller('admin/c-express')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminExpressController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Get('deliveries')
  @Permissions('express:deliveries:read')
  async listDeliveries(
    @Query('status') status?: DeliveryStatus,
    @Query('courierId') courierId?: string,
    @Query('userId') userId?: string,
  ) {
    return this.deliveryService.adminFindAll({ status, courierId, userId });
  }

  @Patch('delivery/:id/assign-courier')
  @Permissions('express:deliveries:update')
  async assignCourier(
    @Param('id') id: string,
    @Body() body: { courierId: string },
  ) {
    return this.deliveryService.adminAssignCourier(id, body.courierId);
  }

  @Patch('delivery/:id/status')
  @Permissions('express:deliveries:update')
  async updateDeliveryStatus(
    @Param('id') id: string,
    @Body() body: { status: DeliveryStatus },
  ) {
    return this.deliveryService.adminUpdateStatus(id, body.status);
  }

  @Patch('delivery/:id/mark-paid')
  @Permissions('express:deliveries:update')
  async markPaid(@Param('id') id: string) {
    return this.deliveryService.markAsPaid(id);
  }
}
