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

  async findAll(page = 1, limit = 20, status?: string, priority?: string) {
    const qb = this.taskRepository
      .createQueryBuilder('task')
      .leftJoinAndSelect('task.assignedTo', 'assignedTo')
      .leftJoinAndSelect('task.assignedBy', 'assignedBy')
      .leftJoinAndSelect('task.sector', 'sector')
      .orderBy('task.createdAt', 'DESC')
      .skip((page - 1) * limit)
      .take(limit);

    if (status) qb.andWhere('task.status = :status', { status });
    if (priority) qb.andWhere('task.priority = :priority', { priority });

    const [data, total] = await qb.getManyAndCount();
    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
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
