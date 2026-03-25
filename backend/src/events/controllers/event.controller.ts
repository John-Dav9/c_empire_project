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

import { CEventService } from '../services/event.service';
import { EventAiService } from '../services/event-ai.service';

import { CreateEventDto } from '../dto/create-event.dto';
import { SuggestCategoryDto } from '../dto/suggest-category.dto';
import { UpdateEventDto } from '../dto/update-event.dto';
import { EventCategory } from '../enums/event-category.enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('c-event')
export class CEventController {
  constructor(
    private readonly eventService: CEventService,
    private readonly eventAiService: EventAiService,
  ) {}

  // =========================
  // PUBLIC
  // =========================

  @Public()
  @Get('events')
  async findAll() {
    return this.eventService.findAll();
  }

  @Public()
  @Get('events/:id')
  async findOne(@Param('id') id: string) {
    return this.eventService.findOne(id);
  }

  // =========================
  // ADMIN (tu peux ajouter tes guards ensuite)
  // =========================

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('events:events:create')
  @Post('events')
  async create(@Body() dto: CreateEventDto) {
    return this.eventService.create(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('events:events:update')
  @Patch('events/:id')
  async update(@Param('id') id: string, @Body() dto: UpdateEventDto) {
    return this.eventService.update(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('events:events:delete')
  @Delete('events/:id')
  async remove(@Param('id') id: string) {
    await this.eventService.remove(id);
    return { message: 'Event deleted' };
  }

  // =========================
  // AI HELPERS
  // =========================

  @Public()
  @Post('ai/suggest-category')
  async suggestCategory(@Body() body: SuggestCategoryDto) {
    const category = this.eventAiService.suggestEventCategory(body.need);
    return { category };
  }

  @Public()
  @Get('ai/checklist/:category')
  async checklist(@Param('category') category: EventCategory) {
    return {
      category,
      checklist: this.eventAiService.generateChecklist(category),
    };
  }

  @Public()
  @Get('ai/planning/:category')
  async planning(@Param('category') category: EventCategory) {
    return {
      category,
      planning: this.eventAiService.generatePlanning(category),
    };
  }

  @Public()
  @Get('ai/decor-ideas/:category')
  async decorIdeas(@Param('category') category: EventCategory) {
    return {
      category,
      ideas: this.eventAiService.suggestDecorationIdeas(category),
    };
  }
}
