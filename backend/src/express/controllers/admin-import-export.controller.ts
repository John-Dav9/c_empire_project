import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { ImportExportStatus } from '../enums/import-export-status.enum';
import { ImportExportService } from '../services/import-export.service';

@Controller('admin/c-express/import-export')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
export class AdminImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  @Get()
  @Permissions('express:deliveries:read')
  list(
    @Query('status') status?: ImportExportStatus,
    @Query('userId') userId?: string,
    @Query('originCountry') originCountry?: string,
    @Query('destinationCountry') destinationCountry?: string,
  ) {
    return this.importExportService.adminFindAll({
      status,
      userId,
      originCountry,
      destinationCountry,
    });
  }

  @Patch(':id/quote')
  @Permissions('express:deliveries:update')
  quote(
    @Param('id') id: string,
    @Body() body: { finalPrice: number; adminComment?: string },
  ) {
    return this.importExportService.adminQuote(id, body);
  }

  @Patch(':id/status')
  @Permissions('express:deliveries:update')
  updateStatus(
    @Param('id') id: string,
    @Body() body: { status: ImportExportStatus },
  ) {
    return this.importExportService.adminUpdateStatus(id, body.status);
  }
}
