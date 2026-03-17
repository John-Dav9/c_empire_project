// health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('health')
export class HealthController {
  @Public()
  @Get()
  health() {
    return {
      status: 'ok',
      service: 'C-EMPIRE API',
      time: new Date(),
    };
  }
}
