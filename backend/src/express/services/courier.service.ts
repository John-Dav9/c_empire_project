import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CourierEntity } from '../entities/courier.entity';

@Injectable()
export class CourierService {
  constructor(
    @InjectRepository(CourierEntity)
    private readonly courierRepo: Repository<CourierEntity>,
  ) {}

  async create(payload: {
    fullName: string;
    phone: string;
    vehicleType: string;
    city?: string;
    country?: string;
    adminNote?: string;
  }) {
    if (!payload.fullName?.trim())
      throw new BadRequestException('fullName is required');
    if (!payload.phone?.trim())
      throw new BadRequestException('phone is required');
    if (!payload.vehicleType?.trim())
      throw new BadRequestException('vehicleType is required');

    const courier = this.courierRepo.create({
      fullName: payload.fullName.trim(),
      phone: payload.phone.trim(),
      vehicleType: payload.vehicleType.trim(),
      city: payload.city?.trim(),
      country: payload.country?.trim(),
      adminNote: payload.adminNote,
      available: true,
    });

    return this.courierRepo.save(courier);
  }

  async findAll(filters?: {
    available?: boolean;
    vehicleType?: string;
    city?: string;
  }) {
    const qb = this.courierRepo
      .createQueryBuilder('c')
      .orderBy('c.createdAt', 'DESC');

    if (typeof filters?.available === 'boolean') {
      qb.andWhere('c.available = :available', { available: filters.available });
    }
    if (filters?.vehicleType) {
      qb.andWhere('LOWER(c.vehicleType) = LOWER(:vehicleType)', {
        vehicleType: filters.vehicleType,
      });
    }
    if (filters?.city) {
      qb.andWhere('LOWER(c.city) = LOWER(:city)', { city: filters.city });
    }

    return qb.getMany();
  }

  async findOneOrFail(id: string) {
    const courier = await this.courierRepo.findOne({ where: { id } });
    if (!courier) throw new NotFoundException('Courier not found');
    return courier;
  }

  async update(
    id: string,
    payload: Partial<{
      fullName: string;
      phone: string;
      vehicleType: string;
      city: string;
      country: string;
      adminNote: string;
      available: boolean;
    }>,
  ) {
    const courier = await this.findOneOrFail(id);

    if (payload.fullName !== undefined)
      courier.fullName = payload.fullName.trim();
    if (payload.phone !== undefined) courier.phone = payload.phone.trim();
    if (payload.vehicleType !== undefined)
      courier.vehicleType = payload.vehicleType.trim();
    if (payload.city !== undefined) courier.city = payload.city?.trim();
    if (payload.country !== undefined)
      courier.country = payload.country?.trim();
    if (payload.adminNote !== undefined) courier.adminNote = payload.adminNote;
    if (payload.available !== undefined) courier.available = payload.available;

    return this.courierRepo.save(courier);
  }

  async setAvailability(id: string, available: boolean) {
    const courier = await this.findOneOrFail(id);
    courier.available = available;
    return this.courierRepo.save(courier);
  }

  async remove(id: string) {
    const courier = await this.findOneOrFail(id);
    await this.courierRepo.remove(courier);
    return { deleted: true };
  }
}
