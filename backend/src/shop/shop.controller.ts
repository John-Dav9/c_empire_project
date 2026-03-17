import { Controller, Get } from '@nestjs/common';

@Controller('cshop')
export class CshopController {
  @Get('health')
  getHealth(): { status: string; message: string } {
    return {
      status: 'ok',
      message: 'CSHOP module is up and running',
    };
  }
}
