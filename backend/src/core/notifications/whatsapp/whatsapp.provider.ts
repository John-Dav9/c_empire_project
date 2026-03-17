import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class WhatsappProvider {
  private readonly logger = new Logger(WhatsappProvider.name);

  async send(to: string, message: string): Promise<void> {
    const mode = String(process.env.WHATSAPP_PROVIDER || 'disabled')
      .trim()
      .toLowerCase();

    if (mode === 'mock') {
      this.logger.warn(`WhatsApp mock -> ${to}`);
      this.logger.debug(message);
      return;
    }

    if (mode === 'disabled') {
      throw new ServiceUnavailableException(
        'Le provider WhatsApp est desactive.',
      );
    }

    throw new ServiceUnavailableException(
      `Le provider WhatsApp "${mode}" n'est pas implemente.`,
    );
  }
}
