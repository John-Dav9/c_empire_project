import { Controller, Get } from '@nestjs/common';
import { TodoServicesService } from '../services/todo-services.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('todo')
@Public()
export class TodoPublicController {
  constructor(private readonly todoServices: TodoServicesService) {}

  // GET /api/todo
  @Get()
  findAllServices() {
    return this.todoServices.findAll();
  }
}
