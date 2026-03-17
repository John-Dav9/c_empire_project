import { Module, forwardRef } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { TodoOrder } from './entities/todo-order.entity';
import { TodoService as TodoServiceEntity } from './entities/todo-service.entity';

import { TodoOrderService } from './services/todo-order.service';
import { TodoServicesService } from './services/todo-services.service';
import { TodoServiceAdminService } from './services/todo-service.admin.service';
import { TodoSuggestionService } from './services/todo-suggestion.service';
import { TodoStatsService } from './services/todo-stats.service';

import { TodoOrderController } from './controllers/todo-order.controller';
import { TodoServiceAdminController } from './controllers/todo-service.admin.controller';
import { TodoSuggestionController } from './controllers/todo-suggestion.controller';
import { TodoAdminStatsController } from './controllers/todo-admin-stats.controller';

import { PaymentsModule } from 'src/core/payments/payments.module';
import { TodoPublicController } from './controllers/todo-public.controller';

@Module({
  imports: [
    TypeOrmModule.forFeature([TodoOrder, TodoServiceEntity]),
    forwardRef(() => PaymentsModule),
  ],
  providers: [
    TodoOrderService,
    TodoServicesService,
    TodoServiceAdminService,
    TodoSuggestionService,
    TodoStatsService,
  ],
  controllers: [
    TodoOrderController,
    TodoServiceAdminController,
    TodoPublicController,
    TodoSuggestionController,
    TodoAdminStatsController,
  ],
  exports: [TodoOrderService, TodoServicesService, TodoServiceAdminService],
})
export class TodoModule {}
