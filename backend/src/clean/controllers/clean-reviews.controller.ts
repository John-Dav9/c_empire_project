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
import { CreateCleanReviewDto } from '../dto/create-clean-review.dto';
import { UpdateCleanReviewStatusDto } from '../dto/update-clean-review-status.dto';
import { CleanReviewsService } from '../services/clean-reviews.service';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';

@Controller('clean/reviews')
export class CleanReviewsController {
  constructor(private readonly service: CleanReviewsService) {}

  // Public: afficher seulement les avis approuvés
  @Get('public')
  findPublic() {
    return this.service.findPublicApproved();
  }

  // Public: laisser un avis (sera modéré)
  @Post()
  create(@Body() dto: CreateCleanReviewDto) {
    return this.service.create(dto);
  }

  // Admin: tout voir + modérer
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Get()
  findAllAdmin() {
    return this.service.findAllAdmin();
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/status')
  updateStatus(
    @Param('id') id: string,
    @Body() dto: UpdateCleanReviewStatusDto,
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
