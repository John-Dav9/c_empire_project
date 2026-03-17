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
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from '../roles/roles.guard';
import { Roles } from '../roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Permissions } from '../permissions/permissions.decorator';
import { Public } from 'src/auth/decorators/public.decorator';
import { HighlightsService } from './highlights.service';
import { CreateSeasonalCampaignDto } from './dto/create-seasonal-campaign.dto';
import { UpdateSeasonalCampaignDto } from './dto/update-seasonal-campaign.dto';
import { CreateNewsMessageDto } from './dto/create-news-message.dto';
import { UpdateNewsMessageDto } from './dto/update-news-message.dto';

@Controller('highlights')
export class HighlightsController {
  constructor(private readonly highlightsService: HighlightsService) {}

  @Public()
  @Get('campaigns/public/active')
  findPublicCampaigns() {
    return this.highlightsService.findPublicActiveCampaigns();
  }

  @Public()
  @Get('news/public/active')
  findPublicNews() {
    return this.highlightsService.findPublicActiveNews();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:manage')
  @Post('campaigns')
  createCampaign(@Body() dto: CreateSeasonalCampaignDto) {
    return this.highlightsService.createCampaign(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:read')
  @Get('campaigns')
  findAllCampaigns() {
    return this.highlightsService.findAllCampaigns();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:manage')
  @Patch('campaigns/:id')
  updateCampaign(
    @Param('id') id: string,
    @Body() dto: UpdateSeasonalCampaignDto,
  ) {
    return this.highlightsService.updateCampaign(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:manage')
  @Delete('campaigns/:id')
  removeCampaign(@Param('id') id: string) {
    return this.highlightsService.removeCampaign(id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:manage')
  @Post('news')
  createNews(@Body() dto: CreateNewsMessageDto) {
    return this.highlightsService.createNews(dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:read')
  @Get('news')
  findAllNews() {
    return this.highlightsService.findAllNews();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:manage')
  @Patch('news/:id')
  updateNews(@Param('id') id: string, @Body() dto: UpdateNewsMessageDto) {
    return this.highlightsService.updateNews(id, dto);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('highlights:manage')
  @Delete('news/:id')
  removeNews(@Param('id') id: string) {
    return this.highlightsService.removeNews(id);
  }
}
