import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CreateCleanServiceDto } from '../dto/create-clean-service.dto';
import { UpdateCleanServiceDto } from '../dto/update-clean-service.dto';
import { CleanServicesService } from '../services/clean-services.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('cclean/services')
export class CleanServicesController {
  constructor(private readonly service: CleanServicesService) {}

  // Public: liste des services actifs
  @Public()
  @Get()
  findAll(@Query('includeInactive') includeInactive?: string) {
    return this.service.findAll(includeInactive === 'true');
  }

  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  // Admin (on ajoutera guards/roles après)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('clean:services:create')
  @Post()
  create(@Body() dto: CreateCleanServiceDto) {
    return this.service.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('clean:services:update')
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateCleanServiceDto) {
    return this.service.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('clean:services:delete')
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
