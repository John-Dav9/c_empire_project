import {
  IsArray,
  IsBoolean,
  IsDateString,
  IsOptional,
  IsString,
  Length,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

class CampaignItemDto {
  @IsString()
  @Length(2, 120)
  title: string;

  @IsString()
  @Length(1, 40)
  sector: string;

  @IsString()
  @Length(1, 200)
  route: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;
}

export class CreateSeasonalCampaignDto {
  @IsString()
  @Length(2, 120)
  title: string;

  @IsString()
  @Length(2, 120)
  festivalName: string;

  @IsOptional()
  @IsString()
  @Length(2, 120)
  tabLabel?: string;

  @IsDateString()
  startDate: string;

  @IsDateString()
  endDate: string;

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CampaignItemDto)
  items?: CampaignItemDto[];
}
