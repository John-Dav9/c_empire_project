import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('cshop/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}

  @Get()
  getCart(@CurrentUser('userId') userId: string) {
    return this.cartService.getUserCart(userId);
  }

  @Post('add')
  addToCart(@Body() dto: AddToCartDto, @CurrentUser('userId') userId: string) {
    return this.cartService.addToCart(userId, dto);
  }

  @Patch('item/:id')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.cartService.updateItem(userId, id, dto.quantity);
  }

  @Delete('item/:id')
  removeItem(@Param('id') id: string, @CurrentUser('userId') userId: string) {
    return this.cartService.removeItem(userId, id);
  }

  @Delete('clear')
  clearCart(@CurrentUser('userId') userId: string) {
    return this.cartService.clearCart(userId);
  }
}
