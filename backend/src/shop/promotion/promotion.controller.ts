import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Request,
  UseGuards,
} from '@nestjs/common';
import { PromotionService } from './promotion.service';
import { CreatePromoDto } from './dto/create-promo.dto';
import { UpdatePromoDto } from './dto/update-promo.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Controller('cshop/promotions')
export class PromotionController {
  constructor(private readonly promoService: PromotionService) {}

  @Public()
  @Get('public/code/:code')
  async findActiveByCode(@Param('code') code: string) {
    const promo = await this.promoService.findActiveByCode(code);
    if (!promo) {
      return { valid: false };
    }
    return {
      valid: true,
      id: promo.id,
      code: promo.code,
      title: promo.title,
      type: promo.type,
      value: Number(promo.value),
      productIds: (promo.products ?? []).map((product) => product.id),
    };
  }

  @Post()
  @Permissions('shop:promotions:create')
  create(@Body() dto: CreatePromoDto, @Request() req) {
    return this.promoService.create(dto, req.user?.sub);
  }

  @Get()
  @Permissions('shop:promotions:read')
  findAll() {
    return this.promoService.findAll();
  }

  @Get(':id')
  @Permissions('shop:promotions:read')
  findOne(@Param('id') id: string) {
    return this.promoService.findOne(id);
  }

  @Get('product/:productId/active')
  @Permissions('shop:promotions:read')
  findActiveForProduct(@Param('productId') productId: string) {
    return this.promoService.findActiveByProduct(productId);
  }

  @Patch(':id')
  @Permissions('shop:promotions:update')
  update(@Param('id') id: string, @Body() dto: UpdatePromoDto) {
    return this.promoService.update(id, dto);
  }

  @Patch(':id/active/:value')
  @Permissions('shop:promotions:update')
  setActive(@Param('id') id: string, @Param('value') value: string) {
    return this.promoService.setActive(id, value === 'true');
  }

  @Delete(':id')
  @Permissions('shop:promotions:delete')
  remove(@Param('id') id: string) {
    return this.promoService.remove(id);
  }
}
