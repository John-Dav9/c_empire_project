import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Req,
  UseGuards,
} from '@nestjs/common';
import type { Request } from 'express';

import { DeliveryService } from '../services/delivery.service';
import { CreateDeliveryDto } from '../dto/create-delivery.dto';
import { JwtAuthGuard } from 'src/guards/jwt-auth.guard';

// ✅ On force un Request qui a toujours user.id (car JwtAuthGuard l’ajoute)
type AuthRequest = Request & { user: { id: string } };

@Controller('c-express/delivery')
@UseGuards(JwtAuthGuard)
export class DeliveryController {
  constructor(private readonly deliveryService: DeliveryService) {}

  private extractUserId(req: AuthRequest): string {
    return (
      (req as any)?.user?.id ??
      (req as any)?.user?.userId ??
      (req as any)?.user?.sub
    );
  }

  @Post()
  async create(@Req() req: AuthRequest, @Body() dto: CreateDeliveryDto) {
    const userId = this.extractUserId(req);
    return this.deliveryService.create(userId, dto);
  }

  @Get('my')
  async findMy(@Req() req: AuthRequest) {
    const userId = this.extractUserId(req);
    return this.deliveryService.findMy(userId);
  }

  @Get(':id')
  async findOne(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.deliveryService.findOneForUserOrFail(userId, id);
  }

  @Patch(':id/cancel')
  async cancel(@Req() req: AuthRequest, @Param('id') id: string) {
    const userId = this.extractUserId(req);
    return this.deliveryService.cancel(userId, id);
  }
}
