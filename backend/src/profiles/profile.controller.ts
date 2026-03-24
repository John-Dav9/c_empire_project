import {
  Controller,
  Get,
  Patch,
  Body,
  UseGuards,
  NotFoundException,
} from '@nestjs/common';
import { ProfileService } from './profile.service';
import { UpdateProfileDto } from 'src/dto/update-profile.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('profiles')
@UseGuards(JwtAuthGuard)
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get('me')
  findByUser(@CurrentUser('userId') userId: string) {
    return this.profileService.findByUser(userId);
  }

  @Patch('me')
  async update(
    @CurrentUser('userId') userId: string,
    @Body() dto: UpdateProfileDto,
  ) {
    const profile = await this.profileService.findByUser(userId);
    if (!profile) {
      throw new NotFoundException('Profile not found');
    }
    return this.profileService.update(profile.id, dto);
  }
}
