import { Injectable } from '@nestjs/common';
import { GetTodoSuggestionsDto } from '../dto/get-todo-suggestions.dto';
import { TodoSuggestionResult } from '../interfaces/todo-suggestion.interface';

@Injectable()
export class TodoSuggestionService {
  /**
   * IA-ready:
   * - Aujourd'hui: suggestions "règles métier" (fallback).
   * - Demain: remplacer / enrichir par un provider IA (OpenAI, etc.).
   */
  async suggest(dto: GetTodoSuggestionsDto): Promise<TodoSuggestionResult> {
    const suggestions = [
      {
        title: 'Ménage léger',
        description: 'Rangement rapide + dépoussiérage + surfaces principales.',
        estimatedMinutes: 60,
        tags: ['home'],
      },
      {
        title: 'Lessive + pliage',
        description: 'Lancer une lessive, étendre/sécher et plier le linge.',
        estimatedMinutes: 90,
        tags: ['home'],
      },
      {
        title: 'Courses à domicile',
        description: 'Récupération de la liste + achat + livraison.',
        estimatedMinutes: 75,
        tags: ['errands'],
      },
      {
        title: 'Récupération / dépôt de colis',
        description: 'Retrait ou dépôt de colis/documents (point relais).',
        estimatedMinutes: 45,
        tags: ['delivery'],
      },
      {
        title: 'Cuisine simple',
        description: 'Préparation d’un repas simple (batch cooking possible).',
        estimatedMinutes: 90,
        tags: ['food'],
      },
      {
        title: 'Aide administrative',
        description: 'Dépôt de documents, impression, petites démarches.',
        estimatedMinutes: 60,
        tags: ['admin'],
      },
    ];

    // Mini-personnalisation (sans IA)
    const urgency = dto.urgency ?? 'medium';
    const prioritized =
      urgency === 'high'
        ? [
            suggestions[3],
            suggestions[2],
            suggestions[0],
            ...suggestions.filter((_, i) => ![3, 2, 0].includes(i)),
          ]
        : suggestions;

    return {
      input: { context: dto.context, location: dto.location, urgency },
      suggestions: prioritized,
    };
  }
}
