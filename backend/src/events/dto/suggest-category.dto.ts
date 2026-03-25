import { IsString, IsNotEmpty } from 'class-validator';

export class SuggestCategoryDto {
  @IsString()
  @IsNotEmpty()
  need: string;
}
