export interface TodoSuggestionItem {
  title: string;
  description: string;
  estimatedMinutes?: number;
  tags?: string[];
}

export interface TodoSuggestionResult {
  input: {
    context?: string;
    location?: string;
    urgency?: 'low' | 'medium' | 'high';
  };
  suggestions: TodoSuggestionItem[];
}
