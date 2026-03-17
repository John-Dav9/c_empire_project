// src/sectors/c-todo/controllers/todo-order.controller.ts
import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CreateTodoOrderDto } from '../dto/create-todo-order.dto';
import { TodoOrderStatus } from '../enums/todo-order-status.enum';
import { TodoOrderService } from '../services/todo-order.service';
import { PaymentProvider } from 'src/core/payments/providers/payment-provider.enum';
import { PaymentReferenceType } from 'src/core/payments/payment-reference-type.enum';
import { PaymentsService } from 'src/core/payments/payments.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';
import { Permissions } from 'src/core/permissions/permissions.decorator';

@Controller('c-todo/orders')
@UseGuards(JwtAuthGuard)
export class TodoOrderController {
  constructor(
    private readonly service: TodoOrderService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  create(@Body() dto: CreateTodoOrderDto, @Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    return this.service.create(dto, userId);
  }

  @Get('my')
  findMine(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    return this.service.findByUser(userId);
  }

  @Get('missions')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('todo:orders:read')
  findMissions() {
    return this.service.findMissions();
  }

  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('todo:orders:read')
  findAll() {
    return this.service.findAll();
  }

  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.EMPLOYEE, UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('todo:orders:update')
  updateStatus(
    @Param('id') id: string,
    @Body('status') status: TodoOrderStatus,
  ) {
    return this.service.updateStatus(id, status);
  }

  // ✅ init paiement
  @Post(':id/pay')
  async pay(
    @Param('id') id: string,
    @Body()
    body: { provider: PaymentProvider; metadata?: Record<string, unknown> },
    @Req() req: AuthenticatedRequest,
  ) {
    const order = await this.service.findOne(id);
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;

    return this.paymentsService.initPayment({
      userId,
      provider: body.provider,
      referenceType: PaymentReferenceType.TODO_TASK,
      referenceId: order.id,
      currency: order.currency,
      metadata: body.metadata,
    });
  }
}
