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
import { RelayPointService } from './relay-point.service';
import { CreateRelayPointDto } from './dto/create-relay-point.dto';
import { Public } from 'src/auth/decorators/public.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';

@Controller('cshop/relay-points')
export class RelayPointController {
  constructor(private readonly service: RelayPointService) {}

  /** Liste publique des points relais actifs */
  @Public()
  @Get()
  findAll() {
    return this.service.findAll();
  }

  /** Liste admin (tous, incluant inactifs) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get('admin')
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  /** Détail d'un point relais */
  @Public()
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  /** Créer un point relais (admin) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Post()
  create(@Body() dto: CreateRelayPointDto) {
    return this.service.create(dto);
  }

  /** Mettre à jour un point relais (admin) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateRelayPointDto>) {
    return this.service.update(id, dto);
  }

  /** Activer / désactiver un point relais (admin) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/active')
  setActive(@Param('id') id: string, @Body('isActive') isActive: boolean) {
    return this.service.setActive(id, isActive);
  }

  /** Supprimer un point relais (super admin) */
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
