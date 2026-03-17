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

import { CourierService } from '../services/courier.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';

@Controller('admin/c-express/couriers')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminCourierController {
  constructor(private readonly courierService: CourierService) {}

  @Post()
  @Permissions('express:couriers:create')
  async create(
    @Body()
    body: {
      fullName: string;
      phone: string;
      vehicleType: string;
      city?: string;
      country?: string;
      adminNote?: string;
    },
  ) {
    return this.courierService.create(body);
  }

  @Get()
  @Permissions('express:couriers:read')
  async list(
    @Query('available') available?: string,
    @Query('vehicleType') vehicleType?: string,
    @Query('city') city?: string,
  ) {
    const parsedAvailable =
      available === undefined ? undefined : available === 'true';

    return this.courierService.findAll({
      available: parsedAvailable,
      vehicleType,
      city,
    });
  }

  @Get(':id')
  @Permissions('express:couriers:read')
  async getOne(@Param('id') id: string) {
    return this.courierService.findOneOrFail(id);
  }

  @Patch(':id')
  @Permissions('express:couriers:update')
  async update(
    @Param('id') id: string,
    @Body()
    body: Partial<{
      fullName: string;
      phone: string;
      vehicleType: string;
      city: string;
      country: string;
      adminNote: string;
      available: boolean;
    }>,
  ) {
    return this.courierService.update(id, body);
  }

  @Patch(':id/availability')
  @Permissions('express:couriers:update')
  async availability(
    @Param('id') id: string,
    @Body() body: { available: boolean },
  ) {
    return this.courierService.setAvailability(id, body.available);
  }

  @Delete(':id')
  @Permissions('express:couriers:delete')
  async remove(@Param('id') id: string) {
    return this.courierService.remove(id);
  }
}
