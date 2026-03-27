import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { GrillOrdersService } from '../services/grill-orders.service';
import { CreateGrillOrderDto } from '../dto/create-grill-order.dto';
import { GrillOrderStatus } from '../enums/grill-order-status.enum';
import { PaymentsService } from 'src/core/payments/payments.service';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';
import { PaymentProvider } from 'src/core/payments/providers/payment-provider.enum';
import { DeliveryService } from 'src/express/services/delivery.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('grill/orders')
export class GrillOrdersController {
  constructor(
    private readonly ordersService: GrillOrdersService,
    private readonly paymentsService: PaymentsService,
    private readonly deliveryService: DeliveryService,
  ) {}

  // Client history
  @UseGuards(JwtAuthGuard)
  @Get('me')
  findMine(@CurrentUser('userId') userId: string) {
    return this.ordersService.findByUser(userId);
  }

  // Public
  @Public()
  @Post()
  create(
    @Body() dto: CreateGrillOrderDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.ordersService.create(dto, userId);
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  // Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:orders:read')
  @Get('admin/all')
  findAllAdmin() {
    return this.ordersService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:orders:update')
  @Patch('admin/:id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: GrillOrderStatus },
  ) {
    return this.ordersService.updateStatus(id, body.status);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/pay')
  pay(
    @Param('id') id: string,
    @Body() body: { provider: PaymentProvider },
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.initPayment({
      userId,
      referenceType: PaymentReferenceType.GRILLFOOD_ORDER,
      referenceId: id,
      provider: body.provider,
      currency: 'XAF',
    });
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:orders:update')
  @Post('admin/:id/refresh-delivery')
  async refreshDelivery(@Param('id') id: string) {
    const order = await this.ordersService.findOne(id);
    if (!order.expressOrderId) return { message: 'No express delivery linked' };

    const delivery = await this.deliveryService.findOneOrFail(
      order.expressOrderId,
    );

    // ici, tu passes delivery.status (string) au mapping
    return this.ordersService.syncDeliveryStatusFromExpress(
      id,
      String(delivery.status),
    );
  }
}
