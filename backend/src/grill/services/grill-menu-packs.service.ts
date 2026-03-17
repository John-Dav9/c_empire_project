import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GrillMenuPack } from '../entities/grill-menu-pack.entity';
import { GrillMenuPackItem } from '../entities/grill-menu-pack-item.entity';
import { GrillProduct } from '../entities/grill-product.entity';
import { CreateGrillMenuPackDto } from '../dto/create-grill-menu-pack.dto';
import { UpdateGrillMenuPackDto } from '../dto/update-grill-menu-pack.dto';

@Injectable()
export class GrillMenuPacksService {
  constructor(
    @InjectRepository(GrillMenuPack)
    private readonly packRepo: Repository<GrillMenuPack>,
    @InjectRepository(GrillMenuPackItem)
    private readonly packItemRepo: Repository<GrillMenuPackItem>,
    @InjectRepository(GrillProduct)
    private readonly productRepo: Repository<GrillProduct>,
  ) {}

  async create(dto: CreateGrillMenuPackDto) {
    if (!dto.items?.length)
      throw new BadRequestException('Menu pack sans items');

    // check produits existent
    for (const it of dto.items) {
      const p = await this.productRepo.findOne({ where: { id: it.productId } });
      if (!p)
        throw new BadRequestException(
          `Produit introuvable dans le pack: ${it.productId}`,
        );
      if (it.qty <= 0) throw new BadRequestException('Quantité pack invalide');
    }

    const pack = this.packRepo.create({
      title: dto.title,
      description: dto.description,
      price: dto.price,
      currency: dto.currency ?? 'XAF',
      isAvailable: dto.isAvailable ?? true,
      images: dto.images,
      items: dto.items.map((it) =>
        this.packItemRepo.create({ productId: it.productId, qty: it.qty }),
      ),
    });

    return this.packRepo.save(pack);
  }

  findAllPublic() {
    return this.packRepo.find({
      where: { isAvailable: true },
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  findAllAdmin() {
    return this.packRepo.find({
      relations: { items: true },
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string) {
    const pack = await this.packRepo.findOne({
      where: { id },
      relations: { items: true },
    });
    if (!pack) throw new NotFoundException('Menu pack introuvable');
    return pack;
  }

  async update(id: string, dto: UpdateGrillMenuPackDto) {
    const pack = await this.findOne(id);

    if (dto.items) {
      // replace items
      pack.items = dto.items.map((it) =>
        this.packItemRepo.create({ productId: it.productId, qty: it.qty }),
      );
    }

    Object.assign(pack, dto);
    return this.packRepo.save(pack);
  }

  async remove(id: string) {
    const pack = await this.findOne(id);
    await this.packRepo.remove(pack);
    return { deleted: true };
  }
}
