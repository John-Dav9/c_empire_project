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
import { CreateCleanQuoteDto } from '../dto/create-clean-quote.dto';
import { UpdateCleanQuoteStatusDto } from '../dto/update-clean-quote-status.dto';
import { CleanQuotesService } from '../services/clean-quotes.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';

@Controller('cclean/quotes')
export class CleanQuotesController {
  constructor(private readonly service: CleanQuotesService) {}

  // Public: demander un devis
  @Post()
  create(@Body() dto: CreateCleanQuoteDto) {
    return this.service.create(dto);
  }

  // Admin: lister/consulter/maj
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAll() {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCleanQuoteStatusDto,
  ) {
    return this.service.updateStatus(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
}
