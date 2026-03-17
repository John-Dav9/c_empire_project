import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { SeasonalCampaign } from './entities/seasonal-campaign.entity';
import { NewsMessage } from './entities/news-message.entity';
import { CreateSeasonalCampaignDto } from './dto/create-seasonal-campaign.dto';
import { UpdateSeasonalCampaignDto } from './dto/update-seasonal-campaign.dto';
import { CreateNewsMessageDto } from './dto/create-news-message.dto';
import { UpdateNewsMessageDto } from './dto/update-news-message.dto';

@Injectable()
export class HighlightsService {
  constructor(
    @InjectRepository(SeasonalCampaign)
    private readonly campaignRepo: Repository<SeasonalCampaign>,
    @InjectRepository(NewsMessage)
    private readonly newsRepo: Repository<NewsMessage>,
  ) {}

  createCampaign(dto: CreateSeasonalCampaignDto) {
    const campaign = this.campaignRepo.create({
      ...dto,
      startDate: new Date(dto.startDate),
      endDate: new Date(dto.endDate),
      isActive: dto.isActive ?? true,
    });
    return this.campaignRepo.save(campaign);
  }

  findAllCampaigns() {
    return this.campaignRepo.find({ order: { startDate: 'DESC' } });
  }

  async updateCampaign(id: string, dto: UpdateSeasonalCampaignDto) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    Object.assign(campaign, dto);
    if (dto.startDate) campaign.startDate = new Date(dto.startDate);
    if (dto.endDate) campaign.endDate = new Date(dto.endDate);
    return this.campaignRepo.save(campaign);
  }

  async removeCampaign(id: string) {
    const campaign = await this.campaignRepo.findOne({ where: { id } });
    if (!campaign) throw new NotFoundException('Campaign not found');
    await this.campaignRepo.remove(campaign);
    return { deleted: true };
  }

  findPublicActiveCampaigns() {
    const now = new Date();
    return this.campaignRepo
      .createQueryBuilder('campaign')
      .where('campaign.isActive = :active', { active: true })
      .andWhere('campaign.startDate <= :now', { now })
      .andWhere('campaign.endDate >= :now', { now })
      .orderBy('campaign.startDate', 'ASC')
      .getMany();
  }

  createNews(dto: CreateNewsMessageDto) {
    const news = this.newsRepo.create({
      ...dto,
      isActive: dto.isActive ?? true,
      priority: dto.priority ?? 0,
      startDate: dto.startDate ? new Date(dto.startDate) : undefined,
      endDate: dto.endDate ? new Date(dto.endDate) : undefined,
    });
    return this.newsRepo.save(news);
  }

  findAllNews() {
    return this.newsRepo.find({
      order: { priority: 'DESC', createdAt: 'DESC' },
    });
  }

  async updateNews(id: string, dto: UpdateNewsMessageDto) {
    const news = await this.newsRepo.findOne({ where: { id } });
    if (!news) throw new NotFoundException('News not found');
    Object.assign(news, dto);
    if (dto.startDate !== undefined) {
      news.startDate = dto.startDate ? new Date(dto.startDate) : undefined;
    }
    if (dto.endDate !== undefined) {
      news.endDate = dto.endDate ? new Date(dto.endDate) : undefined;
    }
    return this.newsRepo.save(news);
  }

  async removeNews(id: string) {
    const news = await this.newsRepo.findOne({ where: { id } });
    if (!news) throw new NotFoundException('News not found');
    await this.newsRepo.remove(news);
    return { deleted: true };
  }

  findPublicActiveNews() {
    const now = new Date();
    return this.newsRepo
      .createQueryBuilder('news')
      .where('news.isActive = :active', { active: true })
      .andWhere('(news.startDate IS NULL OR news.startDate <= :now)', { now })
      .andWhere('(news.endDate IS NULL OR news.endDate >= :now)', { now })
      .orderBy('news.priority', 'DESC')
      .addOrderBy('news.createdAt', 'DESC')
      .getMany();
  }
}
