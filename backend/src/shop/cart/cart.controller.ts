import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto } from './dto/add-to-cart.dto';
import { UpdateCartItemDto } from './dto/update-cart-item.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';

@Controller('cshop/cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(private readonly cartService: CartService) {}
  private extractUserId(req: AuthenticatedRequest): string {
    return req.user?.userId ?? req.user?.id ?? req.user?.sub;
  }

  @Get()
  getCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.getUserCart(this.extractUserId(req));
  }

  @Post('add')
  addToCart(@Body() dto: AddToCartDto, @Req() req: AuthenticatedRequest) {
    return this.cartService.addToCart(this.extractUserId(req), dto);
  }

  @Patch('item/:id')
  updateItem(
    @Param('id') id: string,
    @Body() dto: UpdateCartItemDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.cartService.updateItem(
      this.extractUserId(req),
      id,
      dto.quantity,
    );
  }

  @Delete('item/:id')
  removeItem(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.cartService.removeItem(this.extractUserId(req), id);
  }

  @Delete('clear')
  clearCart(@Req() req: AuthenticatedRequest) {
    return this.cartService.clearCart(this.extractUserId(req));
  }
}
