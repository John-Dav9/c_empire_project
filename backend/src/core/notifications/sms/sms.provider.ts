import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';

@Injectable()
export class SmsProvider {
  private readonly logger = new Logger(SmsProvider.name);

  async send(to: string, message: string): Promise<void> {
    const mode = String(process.env.SMS_PROVIDER || 'disabled')
      .trim()
      .toLowerCase();

    if (mode === 'mock') {
      this.logger.warn(`SMS mock -> ${to}`);
      this.logger.debug(message);
      return;
    }

    if (mode === 'disabled') {
      throw new ServiceUnavailableException('Le provider SMS est desactive.');
    }

    throw new ServiceUnavailableException(
      `Le provider SMS "${mode}" n'est pas implemente.`,
    );
  }
}
