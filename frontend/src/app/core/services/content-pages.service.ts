import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiService } from './api.service';

export interface ContentSection {
  title: string;
  body: string;
}

export interface ContentFaqItem {
  question: string;
  answer: string;
}

export interface ContentPage {
  slug: string;
  title: string;
  subtitle?: string;
  heroTitle?: string;
  heroText?: string;
  ctaLabel?: string;
  ctaUrl?: string;
  highlights?: string[];
  sections?: ContentSection[];
  faq?: ContentFaqItem[];
  published?: boolean;
  metadata?: Record<string, unknown>;
}

@Injectable({ providedIn: 'root' })
export class ContentPagesService {
  constructor(private readonly api: ApiService) {}

  getPublicPage(slug: string): Observable<ContentPage | null> {
    return this.api.get<ContentPage | null>(`/settings/content-pages/public/${slug}`);
  }

  getAdminPages(): Observable<Record<string, ContentPage>> {
    return this.api.get<Record<string, ContentPage>>('/settings/content-pages');
  }

  createPage(slug: string, content: ContentPage): Observable<ContentPage> {
    return this.api.post<ContentPage>('/settings/content-pages', { slug, content });
  }

  updatePage(slug: string, content: ContentPage): Observable<ContentPage> {
    return this.api.patch<ContentPage>(`/settings/content-pages/${slug}`, { content });
  }

  deletePage(slug: string): Observable<{ success: boolean }> {
    return this.api.delete<{ success: boolean }>(`/settings/content-pages/${slug}`);
  }
}
