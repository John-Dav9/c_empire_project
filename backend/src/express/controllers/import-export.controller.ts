import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { ImportExportService } from '../services/import-export.service';
import { CreateImportExportDto } from '../dto/create-import-export.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('c-express/import-export')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  /** USER - Créer une demande Import/Export */
  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateImportExportDto,
  ) {
    return this.importExportService.create(userId, dto);
  }

  /** USER - Mes demandes Import/Export */
  @Get('my')
  async findMy(@CurrentUser('userId') userId: string) {
    return this.importExportService.findMy(userId);
  }

  /** USER - Détails sécurisé */
  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.importExportService.findOneForUserOrFail(userId, id);
  }

  /** USER - Accepter un devis */
  @Patch(':id/accept-quote')
  async acceptQuote(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.importExportService.userAcceptQuote(userId, id);
  }
}
