import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateCleanQuoteDto } from '../dto/create-clean-quote.dto';
import { UpdateCleanQuoteStatusDto } from '../dto/update-clean-quote-status.dto';
import { CleanQuote } from '../entities/clean-quote.entity';

@Injectable()
export class CleanQuotesService {
  constructor(
    @InjectRepository(CleanQuote)
    private readonly repo: Repository<CleanQuote>,
  ) {}

  async create(dto: CreateCleanQuoteDto) {
    const quote = this.repo.create({
      ...dto,
      currency: 'EUR',
    });
    return this.repo.save(quote);
  }

  async findAll() {
    return this.repo.find({ order: { createdAt: 'DESC' } });
  }

  async findOne(id: string) {
    const quote = await this.repo.findOne({ where: { id } });
    if (!quote) throw new NotFoundException('CLEAN_QUOTE_NOT_FOUND');
    return quote;
  }

  async updateStatus(id: string, dto: UpdateCleanQuoteStatusDto) {
    const quote = await this.findOne(id);
    quote.status = dto.status;
    if (dto.proposedAmount !== undefined)
      quote.proposedAmount = dto.proposedAmount;
    if (dto.currency) quote.currency = dto.currency;
    if (dto.adminMessage !== undefined) quote.adminMessage = dto.adminMessage;
    return this.repo.save(quote);
  }

  async remove(id: string) {
    const quote = await this.findOne(id);
    await this.repo.remove(quote);
    return { deleted: true };
  }
}
