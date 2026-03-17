import { IsObject, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateContentPageDto {
  @IsString()
  @MinLength(2)
  @MaxLength(120)
  slug: string;

  @IsObject()
  content: Record<string, any>;
}
