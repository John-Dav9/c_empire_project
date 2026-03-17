import {
  IsArray,
  IsBoolean,
  IsOptional,
  IsString,
  IsUrl,
  Length,
} from 'class-validator';

export class CreateSectorDto {
  @IsString()
  @Length(2, 100)
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsString()
  @Length(2, 50)
  code?: string;

  @IsOptional()
  @IsString()
  @IsUrl({ require_tld: false })
  iconUrl?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @IsUrl({ require_tld: false }, { each: true })
  imageUrls?: string[];

  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
