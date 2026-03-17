import { PartialType } from '@nestjs/mapped-types';
import { CreateSeasonalCampaignDto } from './create-seasonal-campaign.dto';

export class UpdateSeasonalCampaignDto extends PartialType(
  CreateSeasonalCampaignDto,
) {}
