import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Res,
  ForbiddenException,
} from '@nestjs/common';
import { CreateOrderDto } from './dto/create-order.dto';
import { UpdateOrderStatusDto } from './dto/update-order-status.dto';
import { OrderService } from './order.service';
import { Roles } from 'src/core/roles/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import type { Response } from 'express';
import { join } from 'path';
import { existsSync } from 'fs';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('cshop/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  @Post('checkout')
  checkout(@Body() dto: CreateOrderDto, @CurrentUser('userId') userId: string) {
    return this.orderService.checkout(userId, dto);
  }

  @Get('me')
  getMyOrders(@CurrentUser('userId') userId: string) {
    return this.orderService.findUserOrders(userId);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:orders:read')
  @Get()
  getAllOrders() {
    return this.orderService.findAllOrders();
  }

  @Get(':id')
  async getOne(
    @Param('id') id: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
  ) {
    const order = await this.orderService.findOne(id);
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    if (order.userId !== userId && !isAdmin) {
      throw new ForbiddenException('Access denied');
    }
    return order;
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:orders:update')
  @Patch(':id/status')
  updateStatus(@Param('id') id: string, @Body() dto: UpdateOrderStatusDto) {
    return this.orderService.updateStatus(id, dto.status);
  }

  @Get(':id/invoice')
  async downloadInvoice(
    @Param('id') orderId: string,
    @CurrentUser('userId') userId: string,
    @CurrentUser('role') role: UserRole,
    @Res() res: Response,
  ) {
    const order = await this.orderService.findOne(orderId);
    const isAdmin = role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;

    if (order.userId !== userId && !isAdmin) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (!order.isPaid) {
      return res
        .status(400)
        .json({ message: 'Invoice available only after payment' });
    }

    const filePath = join(
      process.cwd(),
      'storage',
      'invoices',
      `invoice_${order.id}.pdf`,
    );

    if (!existsSync(filePath)) {
      return res.status(404).json({ message: 'Invoice not found' });
    }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=invoice_${order.id}.pdf`,
    );

    return res.sendFile(filePath);
  }
}
