import { IsIn, IsOptional, IsString } from 'class-validator';

export class GetTodoSuggestionsDto {
  @IsOptional()
  @IsString()
  context?: string; // ex: "petit appart", "bébé", "après travail", etc.

  @IsOptional()
  @IsString()
  location?: string; // ex: "Bruxelles"

  @IsOptional()
  @IsIn(['low', 'medium', 'high'])
  urgency?: 'low' | 'medium' | 'high';
}
