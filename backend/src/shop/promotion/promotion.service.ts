import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Promotion } from './promotion.entity';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { Product } from '../product/product.entity';

@Injectable()
export class PromotionService {
  constructor(
    @InjectRepository(Promotion)
    private readonly promoRepo: Repository<Promotion>,
    @InjectRepository(Product)
    private readonly productRepo: Repository<Product>,
  ) {}

  async create(dto: CreatePromoDto, createdById?: string): Promise<Promotion> {
    const normalizedCode = dto.code?.trim().toUpperCase();
    if (normalizedCode) {
      const existingByCode = await this.promoRepo.findOne({
        where: { code: normalizedCode },
      });
      if (existingByCode) {
        throw new BadRequestException('Ce code promo existe déjà');
      }
    }

    const products = await this.productRepo.find({
      where: { id: In(dto.productIds) },
    });
    const promo = this.promoRepo.create({
      title: dto.title,
      code: normalizedCode,
      description: dto.description,
      type: dto.type,
      value: dto.value,
      isActive: dto.isActive ?? true,
      startsAt: dto.startsAt,
      endsAt: dto.endsAt,
      products,
      createdById,
    });
    return this.promoRepo.save(promo);
  }

  async findAll(): Promise<Promotion[]> {
    return this.promoRepo.find({
      relations: ['products'],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Promotion> {
    const promo = await this.promoRepo.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!promo) throw new NotFoundException('Promotion not found');
    return promo;
  }

  async findActiveByProduct(productId: string): Promise<Promotion[]> {
    const now = new Date();
    return this.promoRepo
      .createQueryBuilder('promo')
      .innerJoinAndSelect('promo.products', 'product')
      .where('promo.isActive = :active', { active: true })
      .andWhere('product.id = :productId', { productId })
      .andWhere('(promo.startsAt IS NULL OR promo.startsAt <= :now)', { now })
      .andWhere('(promo.endsAt IS NULL OR promo.endsAt >= :now)', { now })
      .getMany();
  }

  async update(id: string, dto: UpdatePromoDto): Promise<Promotion> {
    const promo = await this.findOne(id);
    if (dto.code && dto.code.trim().toUpperCase() !== promo.code) {
      const normalizedCode = dto.code.trim().toUpperCase();
      const existingByCode = await this.promoRepo.findOne({
        where: { code: normalizedCode },
      });
      if (existingByCode) {
        throw new BadRequestException('Ce code promo existe déjà');
      }
      promo.code = normalizedCode;
    }
    if (dto.productIds) {
      const products = await this.productRepo.find({
        where: { id: In(dto.productIds) },
      });
      promo.products = products;
    }
    Object.assign(promo, dto);
    return this.promoRepo.save(promo);
  }

  async findActiveByCode(code: string): Promise<Promotion | null> {
    const normalizedCode = code.trim().toUpperCase();
    const now = new Date();
    return this.promoRepo
      .createQueryBuilder('promo')
      .leftJoinAndSelect('promo.products', 'product')
      .where('promo.code = :code', { code: normalizedCode })
      .andWhere('promo.isActive = :active', { active: true })
      .andWhere('(promo.startsAt IS NULL OR promo.startsAt <= :now)', { now })
      .andWhere('(promo.endsAt IS NULL OR promo.endsAt >= :now)', { now })
      .getOne();
  }

  async remove(id: string): Promise<{ deleted: boolean }> {
    const promo = await this.findOne(id);
    await this.promoRepo.remove(promo);
    return { deleted: true };
  }

  async setActive(id: string, isActive: boolean): Promise<Promotion> {
    const promo = await this.findOne(id);
    promo.isActive = isActive;
    return this.promoRepo.save(promo);
  }
}
