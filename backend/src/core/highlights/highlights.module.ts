import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { HighlightsController } from './highlights.controller';
import { HighlightsService } from './highlights.service';
import { SeasonalCampaign } from './entities/seasonal-campaign.entity';
import { NewsMessage } from './entities/news-message.entity';

@Module({
  imports: [TypeOrmModule.forFeature([SeasonalCampaign, NewsMessage])],
  controllers: [HighlightsController],
  providers: [HighlightsService],
  exports: [HighlightsService],
})
export class HighlightsModule {}
