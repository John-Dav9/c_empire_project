import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoService } from '../entities/todo-service.entity';

@Injectable()
export class TodoServicesService {
  constructor(
    @InjectRepository(TodoService)
    private readonly repo: Repository<TodoService>,
  ) {}

  findAll() {
    return this.repo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }
}
