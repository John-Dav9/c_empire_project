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
import { GrillMenuPacksService } from '../services/grill-menu-packs.service';
import { CreateGrillMenuPackDto } from '../dto/create-grill-menu-pack.dto';
import { UpdateGrillMenuPackDto } from '../dto/update-grill-menu-pack.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('grill/menu-packs')
export class GrillMenuPacksController {
  constructor(private readonly packsService: GrillMenuPacksService) {}

  // Public
  @Public()
  @Get()
  findAllPublic() {
    return this.packsService.findAllPublic();
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.packsService.findOne(id);
  }

  // Admin
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:menus:create')
  @Post('admin')
  create(@Body() dto: CreateGrillMenuPackDto) {
    return this.packsService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:menus:read')
  @Get('admin/all')
  findAllAdmin() {
    return this.packsService.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:menus:update')
  @Patch('admin/:id')
  update(@Param('id') id: string, @Body() dto: UpdateGrillMenuPackDto) {
    return this.packsService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('grill:menus:delete')
  @Delete('admin/:id')
  remove(@Param('id') id: string) {
    return this.packsService.remove(id);
  }
}
