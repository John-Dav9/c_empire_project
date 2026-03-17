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
import { GrillProductsService } from '../services/grill-products.service';
import { CreateGrillProductDto } from '../dto/create-grill-product.dto';
import { UpdateGrillProductDto } from '../dto/update-grill-product.dto';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('grill/products')
export class GrillProductsController {
  constructor(private readonly productsService: GrillProductsService) {}

  // Public
  @Public()
  @Get()
  findAllPublic() {
    return this.productsService.findAllPublic();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.productsService.findOne(id);
  }

  // Admin (on branchera tes guards/roles après)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:products:create')
  @Post('admin')
  create(@Body() dto: CreateGrillProductDto) {
    return this.productsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:products:read')
  @Get('admin/all')
  findAllAdmin() {
    return this.productsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:products:update')
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateGrillProductDto) {
    return this.productsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:products:delete')
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.productsService.remove(id);
  }
}
