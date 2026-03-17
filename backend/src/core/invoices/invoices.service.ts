import { Injectable } from '@nestjs/common';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';
import { promises as fs } from 'fs';
import { join } from 'path';
import { Order } from 'src/shop/order/order.entity';
import { Payment } from '../payments/payment.entity';

@Injectable()
export class InvoicesService {
  private async ensureDir(path: string) {
    await fs.mkdir(path, { recursive: true });
  }

  async generateInvoicePdf(order: Order, payment: Payment) {
    const invoicesDir = join(process.cwd(), 'storage', 'invoices');
    await this.ensureDir(invoicesDir);

    const fileName = `invoice_${order.id}.pdf`;
    const filePath = join(invoicesDir, fileName);

    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595, 842]); // A4
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);

    let y = 800;

    const draw = (text: string, size = 11, bold = false) => {
      page.drawText(text, {
        x: 50,
        y,
        size,
        font,
        color: bold ? rgb(0, 0, 0) : rgb(0.2, 0.2, 0.2),
      });
      y -= size + 8;
    };

    // ---- HEADER
    draw("C'EMPIRE", 20, true);
    draw('FACTURE', 14, true);
    y -= 10;

    draw(`Commande : ${order.id}`);
    draw(`Client : ${order.userId}`);
    draw(`Date : ${new Date().toLocaleDateString()}`);
    draw(`Paiement : ${payment.provider.toUpperCase()}`);
    draw(`Transaction : ${payment.providerTransactionId ?? '-'}`);

    y -= 15;

    // ---- ITEMS
    draw('Produits', 13, true);
    y -= 5;

    for (const item of order.items) {
      draw(`- ${item.productName} x${item.quantity}  (${item.unitPrice} XAF)`);
    }

    y -= 10;

    // ---- TOTALS
    draw(`Sous-total : ${order.totalAmount} XAF`, 11, true);
    draw(`Livraison : ${order.deliveryFee || 0} XAF`, 11, true);
    draw(`TOTAL PAYÉ : ${payment.amount} XAF`, 13, true);

    y -= 20;

    draw('Merci pour votre confiance.', 10);

    const pdfBytes = await pdfDoc.save();
    await fs.writeFile(filePath, pdfBytes);

    return {
      fileName,
      filePath,
    };
  }
}
