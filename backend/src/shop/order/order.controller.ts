import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
  Res,
  Req,
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
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';

@Controller('cshop/orders')
@UseGuards(JwtAuthGuard)
export class OrderController {
  constructor(private readonly orderService: OrderService) {}

  private extractUserId(req: AuthenticatedRequest): string {
    return req.user?.userId ?? req.user?.id ?? req.user?.sub;
  }

  private isAdmin(req: AuthenticatedRequest): boolean {
    const role = req.user?.role;
    return role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
  }

  @Post('checkout')
  checkout(@Body() dto: CreateOrderDto, @Req() req: AuthenticatedRequest) {
    return this.orderService.checkout(this.extractUserId(req), dto);
  }

  @Get('me')
  getMyOrders(@Req() req: AuthenticatedRequest) {
    return this.orderService.findUserOrders(this.extractUserId(req));
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('shop:orders:read')
  @Get()
  getAllOrders() {
    return this.orderService.findAllOrders();
  }

  @Get(':id')
  async getOne(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    const order = await this.orderService.findOne(id);
    if (order.userId !== this.extractUserId(req) && !this.isAdmin(req)) {
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
    @Req() req: AuthenticatedRequest,
    @Res() res: Response,
  ) {
    const order = await this.orderService.findOne(orderId);

    const requestUserId = this.extractUserId(req);
    const isAdmin = this.isAdmin(req);
    if (order.userId !== requestUserId && !isAdmin) {
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
