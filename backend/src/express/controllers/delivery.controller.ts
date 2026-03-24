import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';

import { DeliveryService } from '../services/delivery.service';
import { CreateDeliveryDto } from '../dto/create-delivery.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';
import { CurrentUser } from 'src/auth/decorators/current-user.decorator';

@Controller('c-express/delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  @Post()
  async create(
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateDeliveryDto,
  ) {
    return this.deliveryService.create(userId, dto);
  }

  @Get('my')
  async findMy(@CurrentUser('userId') userId: string) {
    return this.deliveryService.findMy(userId);
  }

  @Get(':id')
  async findOne(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.deliveryService.findOneForUserOrFail(userId, id);
  }

  @Patch(':id/cancel')
  async cancel(
    @CurrentUser('userId') userId: string,
    @Param('id') id: string,
  ) {
    return this.deliveryService.cancel(userId, id);
  }
}
