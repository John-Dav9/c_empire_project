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

import { EventBookingService } from '../services/event-booking.service';
import { CreateEventBookingDto } from '../dto/create-booking.dto';
import { UpdateEventBookingDto } from '../dto/update-booking.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { RolesGuard } from 'src/core/roles/roles.guard';
import { Roles } from 'src/core/roles/roles.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { User } from 'src/auth/entities/user.entity';
import { Permissions } from 'src/core/permissions/permissions.decorator';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('c-event/bookings')
@UseGuards(JwtAuthGuard)
export class EventBookingController {
  constructor(private readonly bookingService: EventBookingService) {}

  // =========================
  // USER
  // =========================

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateEventBookingDto,
  ) {
    return this.bookingService.createBooking({ id: userId } as User, dto);
  }

  @Get('me')
  async myBookings(@CurrentUser('userId') userId: string) {
    return this.bookingService.findMyBookings({ id: userId } as User);
  }

  @Patch(':id')
  async update(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
    @Body() dto: UpdateEventBookingDto,
  ) {
    return this.bookingService.updateBooking({ id: userId } as User, id, dto);
  }

  @Delete(':id')
  async cancel(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.bookingService.cancelBooking({ id: userId } as User, id);
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
