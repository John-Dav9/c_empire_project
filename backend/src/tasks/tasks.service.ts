import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Task } from './entities/task.entity';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { TaskStatus } from './enums/task.enums';

@Injectable()
export class TasksService {
  constructor(
    @InjectRepository(Task)
    private readonly taskRepository: Repository<Task>,
  ) {}

  async create(dto: CreateTaskDto, assignedById: string): Promise<Task> {
    const task = this.taskRepository.create({
      ...dto,
      assignedById,
    });
    return this.taskRepository.save(task);
  }

  async findAll(): Promise<Task[]> {
    return this.taskRepository.find({
      relations: ['assignedTo', 'assignedBy', 'sector'],
      order: { createdAt: 'DESC' },
    });
  }

  async findByEmployee(employeeId: string): Promise<Task[]> {
    return this.taskRepository.find({
      where: { assignedToId: employeeId },
      relations: ['assignedBy', 'sector'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Task> {
    const task = await this.taskRepository.findOne({
      where: { id },
      relations: ['assignedTo', 'assignedBy', 'sector'],
    });
    if (!task) throw new NotFoundException('Tâche introuvable');
    return task;
  }

  async update(id: string, dto: UpdateTaskDto): Promise<Task> {
    const task = await this.findOne(id);
    if (dto.status === TaskStatus.COMPLETED && !task.completedAt) {
      task.completedAt = new Date();
    }
    Object.assign(task, dto);
    return this.taskRepository.save(task);
  }

  async remove(id: string): Promise<{ message: string }> {
    const task = await this.findOne(id);
    await this.taskRepository.remove(task);
    return { message: 'Tâche supprimée' };
  }
}
