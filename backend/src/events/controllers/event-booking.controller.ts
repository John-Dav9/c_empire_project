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

import { EventBookingService } from '../services/event-booking.service';
import { CreateEventBookingDto } from '../dto/create-booking.dto';
import { UpdateEventBookingDto } from '../dto/update-booking.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import type { AuthenticatedRequest } from 'src/interfaces/authenticated-request.interface';
import { User } from 'src/auth/entities/user.entity';
import { Permissions } from 'src/core/permissions/permissions.decorator';

@Controller('c-event/bookings')
@UseGuards(JwtAuthGuard)
export class EventBookingController {
  constructor(private readonly bookingService: EventBookingService) {}

  private getUser(req: AuthenticatedRequest): User {
    const userId = req.user?.userId ?? req.user?.id ?? req.user?.sub;
    return { id: userId } as User;
  }

  // =========================
  // USER
  // =========================

  @Post()
  async create(
    @Req() req: AuthenticatedRequest,
    @Body() dto: CreateEventBookingDto,
  ) {
    return this.bookingService.createBooking(this.getUser(req), dto);
  }

  @Get('me')
  async myBookings(@Req() req: AuthenticatedRequest) {
    return this.bookingService.findMyBookings(this.getUser(req));
  }

  @Patch(':id')
  async update(
    @Req() req: AuthenticatedRequest,
    @Param('id') id: string,
    @Body() dto: UpdateEventBookingDto,
  ) {
    return this.bookingService.updateBooking(this.getUser(req), id, dto);
  }

  @Delete(':id')
  async cancel(@Req() req: AuthenticatedRequest, @Param('id') id: string) {
    return this.bookingService.cancelBooking(this.getUser(req), id);
  }

  // =========================
  // ADMIN
  // =========================

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('events:bookings:read')
  @Get()
  async findAll() {
    return this.bookingService.findAllBookings();
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('events:bookings:update')
  @Patch(':id/validate')
  async validate(@Param('id') id: string) {
    return this.bookingService.validateBooking(id);
  }

  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @Permissions('events:bookings:update')
  @Patch(':id/refuse')
  async refuse(@Param('id') id: string) {
    return this.bookingService.refuseBooking(id);
  }
}
