import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CleanServiceEntity } from '../entities/clean-service.entity';
import { CreateCleanServiceDto } from '../dto/create-clean-service.dto';
import { UpdateCleanServiceDto } from '../dto/update-clean-service.dto';

@Injectable()
export class CleanServicesService {
  constructor(
    @InjectRepository(CleanServiceEntity)
    private readonly repo: Repository<CleanServiceEntity>,
  ) {}

  async create(dto: CreateCleanServiceDto) {
    const service = this.repo.create({
      ...dto,
      currency: dto.currency ?? 'EUR',
      estimatedDurationMin: dto.estimatedDurationMin ?? 120,
      isActive: dto.isActive ?? true,
    });

    return this.repo.save(service);
  }

  async findAll(includeInactive = false) {
    if (includeInactive)
      return this.repo.find({ order: { createdAt: 'DESC' } });
    return this.repo.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const service = await this.repo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('CLEAN_SERVICE_NOT_FOUND');
    return service;
  }

  async update(id: string, dto: UpdateCleanServiceDto) {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    return this.repo.save(service);
  }

  async remove(id: string) {
    const service = await this.findOne(id);
    await this.repo.remove(service);
    return { deleted: true };
  }
}
