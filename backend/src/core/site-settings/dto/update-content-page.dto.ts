import { IsObject } from 'class-validator';

export class UpdateContentPageDto {
  @IsObject()
  content: Record<string, any>;
}
