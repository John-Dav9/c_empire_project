import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrillProduct } from '../entities/grill-product.entity';
import { CreateGrillProductDto } from '../dto/create-grill-product.dto';
import { UpdateGrillProductDto } from '../dto/update-grill-product.dto';

@Injectable()
export class GrillProductsService {
  constructor(
    @InjectRepository(GrillProduct)
    private readonly productRepo: Repository<GrillProduct>,
  ) {}

  create(dto: CreateGrillProductDto) {
    const product = this.productRepo.create({
      ...dto,
      currency: dto.currency ?? 'XAF',
      isAvailable: dto.isAvailable ?? true,
    });
    return this.productRepo.save(product);
  }

  findAllPublic() {
    return this.productRepo.find({
      where: { isAvailable: true },
      order: { createdAt: 'DESC' },
    });
  }

  findAllAdmin() {
    return this.productRepo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const product = await this.productRepo.findOne({ where: { id } });
    if (!product) throw new NotFoundException('Produit introuvable');
    return product;
  }

  async update(id: string, dto: UpdateGrillProductDto) {
    const product = await this.findOne(id);
    Object.assign(product, dto);
    return this.productRepo.save(product);
  }

  async remove(id: string) {
    const product = await this.findOne(id);
    await this.productRepo.remove(product);
    return { deleted: true };
  }
}
