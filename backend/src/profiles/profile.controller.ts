import {
  Controller,
  Get,
  Patch,
  Body,
  Req,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from 'src/dto/update-profile.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  findByUser(@Req() req: AuthenticatedRequest) {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    return this.profileService.findByUser(userId);
  }

  @Patch('me')
  async update(
    @Req() req: AuthenticatedRequest,
    @Body() dto: UpdateProfileDto,
  ) {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    const profile = await this.profileService.findByUser(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return this.profileService.update(profile.id, dto);
  }
}
