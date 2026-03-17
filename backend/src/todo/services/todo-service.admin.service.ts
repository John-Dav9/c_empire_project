// src/sectors/c-todo/services/todo-service.admin.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { TodoService } from '../entities/todo-service.entity';
import { CreateTodoServiceDto } from '../dto/create-todo-service.dto';
import { UpdateTodoServiceDto } from '../dto/update-todo-service.dto';

@Injectable()
export class TodoServiceAdminService {
  constructor(
    @InjectRepository(TodoService)
    private readonly repo: Repository<TodoService>,
  ) {}

  create(dto: CreateTodoServiceDto) {
    return this.repo.save(this.repo.create(dto));
  }

  findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async update(id: string, dto: UpdateTodoServiceDto) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Todo service not found');
    Object.assign(item, dto);
    return this.repo.save(item);
  }

  async remove(id: string) {
    const item = await this.repo.findOne({ where: { id } });
    if (!item) throw new NotFoundException('Todo service not found');
    await this.repo.remove(item);
    return { deleted: true };
  }
}
