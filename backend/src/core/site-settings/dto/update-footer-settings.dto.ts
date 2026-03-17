import { IsObject } from 'class-validator';

export class UpdateFooterSettingsDto {
  @IsObject()
  config: Record<string, any>;
}
