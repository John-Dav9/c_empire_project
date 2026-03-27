import {
  Controller,
  Post,
  Body,
  Get,
  Patch,
  Param,
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
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('c-todo/orders')
@UseGuards(JwtAuthGuard)
export class TodoOrderController {
  constructor(
    private readonly service: TodoOrderService,
    private readonly paymentsService: PaymentsService,
  ) {}

  @Post()
  create(
    @Body() dto: CreateTodoOrderDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.service.create(dto, userId);
  }

  @Get('my')
  findMine(@CurrentUser('userId') userId: string) {
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

  @Patch(':id/assign')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('todo:orders:update')
  assignEmployee(
    @Param('id') id: string,
    @Body('employeeId') employeeId: string | null,
  ) {
    return this.service.assignEmployee(id, employeeId ?? null);
  }

  @Post(':id/pay')
  async pay(
    @Param('id') id: string,
    @Body() body: { provider: PaymentProvider; metadata?: Record<string, unknown> },
    @CurrentUser('userId') userId: string,
  ) {
    const order = await this.service.findOne(id);
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
