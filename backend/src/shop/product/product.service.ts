import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike, FindOperator } from 'typeorm';
import { Product } from './product.entity';
import { UpdateProductDto } from './dto/update-product.dto';
import { PromotionService } from '../promotion/promotion.service';
import { PromotionType } from '../promotion/promotion-type.enum';
import { Promotion } from '../promotion/promotion.entity';
import { Review } from '../review/review.entity';
import { CreateProductDto } from './dto/reate-product.dto';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,

    // ✅ Agrégats reviews
    @InjectRepository(Review)
    private readonly reviewRepository: Repository<Review>,

    // ✅ Promo active
    private readonly promotionService: PromotionService,
  ) {}

  async create(createProductDto: CreateProductDto): Promise<Product> {
    let slug = createProductDto.slug;

    if (!slug) slug = this.generateSlug(createProductDto.name);

    const product = this.productRepository.create({
      ...createProductDto,
      slug,
      currency: createProductDto.currency || 'XAF',
      isActive: createProductDto.isActive ?? true,
      stock: createProductDto.stock ?? 0,
    });

    return this.productRepository.save(product);
  }

  async getCheckoutSnapshot(productId: string): Promise<{
    id: string;
    name: string;
    unitPrice: number;
    stock: number;
    isActive: boolean;
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
    });
    if (!product) {
      throw new NotFoundException(`Product with id "${productId}" not found`);
    }

    const activePromos = await this.promotionService.findActiveByProduct(
      product.id,
    );
    const activePromo = activePromos[0] ?? null;
    const { finalPrice } = this.computeFinalPrice(product.price, activePromo);

    return {
      id: product.id,
      name: product.name,
      unitPrice: finalPrice,
      stock: Number(product.stock ?? 0),
      isActive: Boolean(product.isActive),
    };
  }

  async findAll(params?: {
    page?: number;
    limit?: number;
    search?: string;
    isActive?: boolean;
  }): Promise<{
    data: Array<
      Product & {
        finalPrice: number;
        activePromo: Promotion | null;
        avgRating: number;
        reviewsCount: number;
      }
    >;
    total: number;
    page: number;
    limit: number;
  }> {
    const page = params?.page && params.page > 0 ? params.page : 1;
    const limit = params?.limit && params.limit > 0 ? params.limit : 10;
    const skip = (page - 1) * limit;

    const where: { isActive?: boolean; name?: FindOperator<string> } = {};
    if (typeof params?.isActive === 'boolean') where.isActive = params.isActive;
    if (params?.search) where.name = ILike(`%${params.search}%`);

    const [products, total] = await this.productRepository.findAndCount({
      where,
      skip,
      take: limit,
      order: { createdAt: 'DESC' },
    });

    const productIds = products.map((p) => p.id);

    // ✅ 1) Agrégats reviews (en une requête)
    const reviewsAgg = productIds.length
      ? await this.reviewRepository
          .createQueryBuilder('r')
          .select('r.productId', 'productId')
          .addSelect('COUNT(*)', 'count')
          .addSelect('AVG(r.rating)', 'avg')
          .where('r.productId IN (:...ids)', { ids: productIds })
          .andWhere('r.isVisible = :vis', { vis: true })
          .groupBy('r.productId')
          .getRawMany()
      : [];

    const aggMap = new Map<string, { count: number; avg: number }>();
    for (const row of reviewsAgg) {
      aggMap.set(row.productId, {
        count: Number(row.count ?? 0),
        avg: Number(row.avg ?? 0),
      });
    }

    // ✅ 2) Promos actives (simple) : on les récupère par produit (petit volume paginé)
    // (Plus tard on optimisera en bulk si besoin)
    const enriched = await Promise.all(
      products.map(async (p) => {
        const activePromos = await this.promotionService.findActiveByProduct(
          p.id,
        );
        const activePromo = activePromos[0] ?? null;

        const { finalPrice } = this.computeFinalPrice(p.price, activePromo);

        const agg = aggMap.get(p.id) ?? { count: 0, avg: 0 };

        return {
          ...p,
          finalPrice,
          activePromo,
          avgRating: Number(agg.avg.toFixed(2)),
          reviewsCount: agg.count,
        };
      }),
    );

    return { data: enriched, total, page, limit };
  }

  async findOne(id: string): Promise<
    Product & {
      finalPrice: number;
      activePromo: Promotion | null;
      avgRating: number;
      reviewsCount: number;
    }
  > {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(`Product with id "${id}" not found`);

    const activePromos = await this.promotionService.findActiveByProduct(
      product.id,
    );
    const activePromo = activePromos[0] ?? null;
    const { finalPrice } = this.computeFinalPrice(product.price, activePromo);

    const reviewAgg = await this.reviewRepository
      .createQueryBuilder('r')
      .select('COUNT(*)', 'count')
      .addSelect('AVG(r.rating)', 'avg')
      .where('r.productId = :pid', { pid: product.id })
      .andWhere('r.isVisible = :vis', { vis: true })
      .getRawOne();

    const reviewsCount = Number(reviewAgg?.count ?? 0);
    const avgRating = Number(Number(reviewAgg?.avg ?? 0).toFixed(2));

    return {
      ...product,
      finalPrice,
      activePromo,
      avgRating,
      reviewsCount,
    };
  }

  async update(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<Product> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(`Product with id "${id}" not found`);

    if (updateProductDto.name && !updateProductDto.slug) {
      updateProductDto.slug = this.generateSlug(updateProductDto.name);
    }

    const updated = this.productRepository.merge(product, updateProductDto);
    return this.productRepository.save(updated);
  }

  async remove(id: string): Promise<void> {
    const product = await this.productRepository.findOne({ where: { id } });
    if (!product)
      throw new NotFoundException(`Product with id "${id}" not found`);
    await this.productRepository.remove(product);
  }

  private computeFinalPrice(
    price: number,
    promo: Promotion | null,
  ): { finalPrice: number } {
    if (!promo) return { finalPrice: Number(price) };

    const p = Number(price);
    const val = Number(promo.value);

    if (promo.type === PromotionType.PERCENT) {
      const discounted = p - (p * val) / 100;
      return { finalPrice: Number(Math.max(0, discounted).toFixed(2)) };
    }

    // FIXED
    const discounted = p - val;
    return { finalPrice: Number(Math.max(0, discounted).toFixed(2)) };
  }

  private generateSlug(value: string): string {
    return value
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)+/g, '');
  }
}
