import { Controller, Get, Query } from '@nestjs/common';
import { GetTodoSuggestionsDto } from '../dto/get-todo-suggestions.dto';
import { TodoSuggestionService } from '../services/todo-suggestion.service';
import { Public } from 'src/auth/decorators/public.decorator';

@Controller('c-todo/suggestions')
@Public()
export class TodoSuggestionController {
  constructor(private readonly service: TodoSuggestionService) {}

  @Get()
  suggest(@Query() dto: GetTodoSuggestionsDto) {
    return this.service.suggest(dto);
  }
}
