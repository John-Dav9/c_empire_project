import { Module } from '@nestjs/common';
import { InvoicesService } from './invoices.service';

@Module({
  providers: [InvoicesService],
  exports: [InvoicesService], // ✅ pour pouvoir l’injecter dans PaymentsService
})
export class InvoicesModule {}
