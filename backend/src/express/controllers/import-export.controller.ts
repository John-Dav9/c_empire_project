import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { ImportExportService } from '../services/import-export.service';
import { CreateImportExportDto } from '../dto/create-import-export.dto';

// Adapte si ton guard a un autre chemin
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// Typage du Request authentifié
type AuthRequest = Request & { user: { id: string } };

@Controller('c-express/import-export')
@UseGuards(JwtAuthGuard)
export class ImportExportController {
  constructor(private readonly importExportService: ImportExportService) {}

  private extractUserId(req: AuthRequest): string {
    return (
      (req as any)?.user?.id ??
      (req as any)?.user?.userId ??
      (req as any)?.user?.sub
    );
  }

  /**
   * USER - Créer une demande Import/Export
   */
  @Post()
  async create(@Req() req: AuthRequest, @Body() dto: CreateImportExportDto) {
    const userId = this.extractUserId(req);
    return this.importExportService.create(userId, dto);
  }

  /**
   * USER - Mes demandes Import/Export
   */
  @Get('my')
  async findMy(@Req() req: AuthRequest) {
    const userId = this.extractUserId(req);
    return this.importExportService.findMy(userId);
  }

  /**
   * USER - Détails sécurisé
   */
  @Get(':id')
  async findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.importExportService.findOneForUserOrFail(userId, id);
  }

  /**
   * USER - Accepter un devis
   * PATCH /c-express/import-export/:id/accept-quote
   */
  @Patch(':id/accept-quote')
  async acceptQuote(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.importExportService.userAcceptQuote(userId, id);
  }
}
