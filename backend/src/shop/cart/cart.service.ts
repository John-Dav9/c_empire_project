import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Cart } from './cart.entity';
import { CartItem } from './cart-item.entity';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { ProductService } from '../product/product.service';

@Injectable()
export class CartService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepo: Repository<Cart>,

    @InjectRepository(CartItem)
    private readonly itemRepo: Repository<CartItem>,

    private readonly productService: ProductService,
  ) {}

  async getUserCart(userId: string): Promise<Cart> {
    let cart = await this.cartRepo.findOne({
      where: { userId, isActive: true },
    });

    if (!cart) {
      cart = this.cartRepo.create({
        userId,
        items: [],
        totalAmount: 0,
      });
      cart = await this.cartRepo.save(cart);
    }

    await this.refreshCartPricing(cart);
    return cart;
  }

  async addToCart(userId: string, dto: AddToCartDto): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    const product = await this.productService.getCheckoutSnapshot(
      dto.productId,
    );

    if (!product.isActive) {
      throw new BadRequestException('Produit inactif.');
    }
    if (product.stock <= 0) {
      throw new BadRequestException('Produit en rupture de stock.');
    }

    const existingItem = cart.items.find(
      (item) => item.productId === dto.productId,
    );

    if (existingItem) {
      const nextQuantity = existingItem.quantity + dto.quantity;
      if (nextQuantity > product.stock) {
        throw new BadRequestException('Quantité demandée supérieure au stock.');
      }
      existingItem.quantity = nextQuantity;
      existingItem.productName = product.name;
      existingItem.unitPrice = product.unitPrice;
    } else {
      if (dto.quantity > product.stock) {
        throw new BadRequestException('Quantité demandée supérieure au stock.');
      }
      const item = this.itemRepo.create({
        productId: product.id,
        productName: product.name,
        unitPrice: product.unitPrice,
        quantity: dto.quantity,
        cart,
      });
      cart.items.push(item);
    }

    cart.totalAmount = this.calculateTotal(cart);
    return this.cartRepo.save(cart);
  }

  async updateItem(
    userId: string,
    itemId: string,
    quantity: number,
  ): Promise<Cart> {
    const cart = await this.getUserCart(userId);

    const item = cart.items.find((i) => i.id === itemId);
    if (!item) {
      throw new NotFoundException('Item not found in cart');
    }

    const product = await this.productService.getCheckoutSnapshot(
      item.productId,
    );
    if (!product.isActive) {
      throw new BadRequestException('Produit inactif.');
    }
    if (quantity > product.stock) {
      throw new BadRequestException('Quantité demandée supérieure au stock.');
    }

    item.quantity = quantity;
    item.productName = product.name;
    item.unitPrice = product.unitPrice;
    cart.totalAmount = this.calculateTotal(cart);

    return this.cartRepo.save(cart);
  }

  async removeItem(userId: string, itemId: string): Promise<Cart> {
    const cart = await this.getUserCart(userId);

    cart.items = cart.items.filter((i) => i.id !== itemId);
    cart.totalAmount = this.calculateTotal(cart);

    return this.cartRepo.save(cart);
  }

  async clearCart(userId: string): Promise<Cart> {
    const cart = await this.getUserCart(userId);
    cart.items = [];
    cart.totalAmount = 0;
    return this.cartRepo.save(cart);
  }

  private calculateTotal(cart: Cart): number {
    return cart.items.reduce(
      (sum, item) => sum + item.unitPrice * item.quantity,
      0,
    );
  }

  private async refreshCartPricing(cart: Cart): Promise<void> {
    for (const item of cart.items) {
      const product = await this.productService.getCheckoutSnapshot(
        item.productId,
      );
      item.productName = product.name;
      item.unitPrice = product.unitPrice;
      if (item.quantity > product.stock) {
        item.quantity = Math.max(1, product.stock);
      }
    }
    cart.items = cart.items.filter((item) => item.quantity > 0);
    cart.totalAmount = this.calculateTotal(cart);
    await this.cartRepo.save(cart);
  }
}
