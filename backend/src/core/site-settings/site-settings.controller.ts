import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { Permissions } from '../permissions/permissions.decorator';
import { Roles } from '../roles/roles.decorator';
import { RolesGuard } from '../roles/roles.guard';
import { CreateContentPageDto } from './dto/create-content-page.dto';
import { UpdateContentPageDto } from './dto/update-content-page.dto';
import { UpdateFooterSettingsDto } from './dto/update-footer-settings.dto';
import { SiteSettingsService } from './site-settings.service';
import { Delete, Param, Post } from '@nestjs/common';

@Controller('settings')
export class SiteSettingsController {
  constructor(private readonly siteSettingsService: SiteSettingsService) {}

  @Public()
  @Get('footer/public')
  getPublicFooter() {
    return this.siteSettingsService.getFooterConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('settings:read')
  @Get('footer')
  getAdminFooter() {
    return this.siteSettingsService.getFooterConfig();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('settings:manage')
  @Patch('footer')
  updateFooter(@Body() dto: UpdateFooterSettingsDto) {
    return this.siteSettingsService.updateFooterConfig(dto.config);
  }

  @Public()
  @Get('content-pages/public')
  getPublicContentPages() {
    return this.siteSettingsService.getPublicContentPages();
  }

  @Public()
  @Get('content-pages/public/:slug')
  getPublicContentPage(@Param('slug') slug: string) {
    return this.siteSettingsService.getPublicContentPage(slug);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('settings:read')
  @Get('content-pages')
  getAdminContentPages() {
    return this.siteSettingsService.getAdminContentPages();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('settings:manage')
  @Post('content-pages')
  createContentPage(@Body() dto: CreateContentPageDto) {
    return this.siteSettingsService.createContentPage(dto.slug, dto.content);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('settings:manage')
  @Patch('content-pages/:slug')
  updateContentPage(
    @Param('slug') slug: string,
    @Body() dto: UpdateContentPageDto,
  ) {
    return this.siteSettingsService.updateContentPage(slug, dto.content);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('settings:manage')
  @Delete('content-pages/:slug')
  deleteContentPage(@Param('slug') slug: string) {
    return this.siteSettingsService.deleteContentPage(slug);
  }
}
