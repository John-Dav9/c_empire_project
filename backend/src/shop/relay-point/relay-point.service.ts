import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { RelayPoint } from './relay-point.entity';
import { CreateRelayPointDto } from './dto/create-relay-point.dto';

@Injectable()
export class RelayPointService {
  constructor(
    @InjectRepository(RelayPoint)
    private readonly repo: Repository<RelayPoint>,
  ) {}

  findAll(): Promise<RelayPoint[]> {
    return this.repo.find({ where: { isActive: true }, order: { city: 'ASC', name: 'ASC' } });
  }

  findAllAdmin(): Promise<RelayPoint[]> {
    return this.repo.find({ order: { city: 'ASC', name: 'ASC' } });
  }

  async findOne(id: string): Promise<RelayPoint> {
    const rp = await this.repo.findOne({ where: { id } });
    if (!rp) throw new NotFoundException('Point relais introuvable');
    return rp;
  }

  create(dto: CreateRelayPointDto): Promise<RelayPoint> {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: Partial<CreateRelayPointDto>): Promise<RelayPoint> {
    const rp = await this.findOne(id);
    Object.assign(rp, dto);
    return this.repo.save(rp);
  }

  async setActive(id: string, isActive: boolean): Promise<RelayPoint> {
    const rp = await this.findOne(id);
    rp.isActive = isActive;
    return this.repo.save(rp);
  }

  async remove(id: string): Promise<void> {
    const rp = await this.findOne(id);
    await this.repo.remove(rp);
  }
}
