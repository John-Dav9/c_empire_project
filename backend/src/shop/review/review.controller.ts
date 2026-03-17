import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import { ReviewService } from './review.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { Roles } from 'src/core/roles/roles.decorator';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('cshop/reviews')
@UseGuards(JwtAuthGuard)
export class ReviewController {
  constructor(private readonly reviewService: ReviewService) {}

  private extractUserId(req: AuthenticatedRequest): string {
    return req.user?.userId ?? req.user?.id ?? req.user?.sub;
  }

  @Post()
  create(@Body() dto: CreateReviewDto, @Req() req: AuthenticatedRequest) {
    return this.reviewService.create(this.extractUserId(req), dto);
  }

  @Public()
  @Get('product/:productId')
  getByProduct(@Param('productId') productId: string) {
    return this.reviewService.findByProduct(productId);
  }

  @Get('me')
  getMyReviews(@Req() req: AuthenticatedRequest) {
    return this.reviewService.findUserReviews(this.extractUserId(req));
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateReviewDto,
    @Req() req: AuthenticatedRequest,
  ) {
    return this.reviewService.update(this.extractUserId(req), id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @Req() req: AuthenticatedRequest) {
    return this.reviewService.remove(this.extractUserId(req), id);
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Patch(':id/visibility/:value')
  setVisibility(@Param('id') id: string, @Param('value') value: string) {
    return this.reviewService.setVisibility(id, value === 'true');
  }
}
