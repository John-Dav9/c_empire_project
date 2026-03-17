import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Sector } from './entities/sector.entity';
import { CreateSectorDto } from './dto/create-sector.dto';
import { UpdateSectorDto } from './dto/update-sector.dto';

@Injectable()
export class SectorsService {
  constructor(
    @InjectRepository(Sector)
    private readonly sectorRepository: Repository<Sector>,
  ) {}

  async create(dto: CreateSectorDto) {
    const exists = await this.sectorRepository.findOne({
      where: { name: dto.name },
    });
    if (exists) {
      throw new BadRequestException('Ce secteur existe déjà.');
    }

    if (dto.code) {
      const codeExists = await this.sectorRepository.findOne({
        where: { code: dto.code },
      });
      if (codeExists) {
        throw new BadRequestException('Ce code secteur existe déjà.');
      }
    }

    const sector = this.sectorRepository.create({
      name: dto.name,
      description: dto.description,
      code: dto.code,
      iconUrl: dto.iconUrl,
      imageUrls: dto.imageUrls ?? [],
      isActive: dto.isActive ?? true,
    });
    return this.sectorRepository.save(sector);
  }

  async findAll() {
    return this.sectorRepository.find({ order: { name: 'ASC' } });
  }

  async findOne(id: string) {
    const sector = await this.sectorRepository.findOne({ where: { id } });
    if (!sector) throw new NotFoundException('Secteur introuvable');
    return sector;
  }

  async update(id: string, dto: UpdateSectorDto) {
    const sector = await this.findOne(id);
    if (dto.name && dto.name !== sector.name) {
      const nameExists = await this.sectorRepository.findOne({
        where: { name: dto.name },
      });
      if (nameExists)
        throw new BadRequestException('Un secteur avec ce nom existe déjà.');
    }
    if (dto.code && dto.code !== sector.code) {
      const codeExists = await this.sectorRepository.findOne({
        where: { code: dto.code },
      });
      if (codeExists) {
        throw new BadRequestException('Un secteur avec ce code existe déjà.');
      }
    }
    Object.assign(sector, dto);
    return this.sectorRepository.save(sector);
  }

  async remove(id: string) {
    const sector = await this.findOne(id);
    await this.sectorRepository.remove(sector);
    return { message: 'Secteur supprimé' };
  }
}
