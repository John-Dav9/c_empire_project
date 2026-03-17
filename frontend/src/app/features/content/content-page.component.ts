import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { ContentPage, ContentPagesService } from '../../core/services/content-pages.service';

@Component({
  selector: 'app-content-page',
  standalone: true,
  imports: [CommonModule, RouterLink, MatButtonModule],
  template: `
    <section class="content-page app-shell-card" *ngIf="!loading && page; else stateTpl">
      <header class="hero">
        <p class="label">C'EMPIRE</p>
        <h1>{{ page.heroTitle || page.title }}</h1>
        <p class="subtitle">{{ page.heroText || page.subtitle }}</p>
        <a
          *ngIf="page.ctaLabel && page.ctaUrl"
          mat-raised-button
          color="primary"
          class="cta"
          [routerLink]="page.ctaUrl"
        >
          {{ page.ctaLabel }}
        </a>
      </header>

      <section class="highlights" *ngIf="page.highlights?.length">
        <article class="chip" *ngFor="let highlight of page.highlights">{{ highlight }}</article>
      </section>

      <section class="sections" *ngIf="page.sections?.length">
        <article class="card" *ngFor="let section of page.sections">
          <h2>{{ section.title }}</h2>
          <p>{{ section.body }}</p>
        </article>
      </section>

      <section class="faq-block" *ngIf="page.faq?.length">
        <h2>Questions frequentes</h2>
        <article class="faq-item" *ngFor="let item of page.faq">
          <h3>{{ item.question }}</h3>
          <p>{{ item.answer }}</p>
        </article>
      </section>
    </section>

    <ng-template #stateTpl>
      <section class="state app-shell-card" *ngIf="loading">Chargement de la page...</section>
      <section class="state app-shell-card error" *ngIf="!loading && error">{{ error }}</section>
    </ng-template>
  `,
  styles: [`
    .content-page {
      padding: clamp(1rem, 2.2vw, 2rem);
      border: 1px solid var(--line);
      display: grid;
      gap: 1.1rem;
    }

    .hero {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: clamp(1rem, 2vw, 1.6rem);
      background: linear-gradient(135deg, rgba(24, 114, 210, 0.09), rgba(18, 164, 166, 0.12));
    }

    .label {
      margin: 0;
      font-size: 0.78rem;
      letter-spacing: 0.14em;
      color: var(--brand-strong);
      font-weight: 800;
      text-transform: uppercase;
    }

    h1 {
      margin: 0.4rem 0;
      font-size: clamp(1.6rem, 4vw, 2.7rem);
      color: var(--ink-0);
      line-height: 1.05;
      font-weight: 800;
    }

    .subtitle {
      margin: 0 0 1rem;
      color: var(--ink-2);
      max-width: 900px;
      line-height: 1.55;
      font-size: clamp(1rem, 1.7vw, 1.15rem);
    }

    .cta {
      min-height: 44px;
      border-radius: 999px;
      padding: 0 1.2rem;
      font-weight: 700;
    }

    .highlights {
      display: flex;
      flex-wrap: wrap;
      gap: 0.65rem;
    }

    .chip {
      padding: 0.55rem 0.9rem;
      border-radius: 999px;
      border: 1px solid rgba(30, 110, 231, 0.25);
      background: rgba(30, 110, 231, 0.09);
      color: var(--ink-1);
      font-weight: 700;
    }

    .sections {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
      gap: 0.9rem;
    }

    .card {
      border-radius: 14px;
      border: 1px solid var(--line);
      background: rgba(255, 255, 255, 0.78);
      padding: 1rem;
    }

    .card h2 {
      margin: 0 0 0.45rem;
      font-size: 1.05rem;
    }

    .card p {
      margin: 0;
      color: var(--ink-2);
      line-height: 1.5;
    }

    .faq-block {
      border: 1px solid var(--line);
      border-radius: 14px;
      padding: 1rem;
      display: grid;
      gap: 0.85rem;
      background: rgba(255, 255, 255, 0.78);
    }

    .faq-block h2 {
      margin: 0;
      font-size: 1.2rem;
    }

    .faq-item h3 {
      margin: 0;
      font-size: 1rem;
    }

    .faq-item p {
      margin: 0.35rem 0 0;
      color: var(--ink-2);
      line-height: 1.5;
    }

    .state {
      border: 1px solid var(--line);
      padding: 1rem;
    }

    .state.error {
      color: #a1271f;
      background: #fff4f1;
      border-color: #f3bdb4;
    }
  `],
})
export class ContentPageComponent implements OnInit {
  page: ContentPage | null = null;
  loading = true;
  error: string | null = null;

  constructor(
    private readonly route: ActivatedRoute,
    private readonly contentPagesService: ContentPagesService,
  ) {}

  ngOnInit(): void {
    const slugFromData = this.route.snapshot.data?.['slug'] as string | undefined;
    const slugFromParam = this.route.snapshot.paramMap.get('slug') || undefined;
    const slug = slugFromData || slugFromParam;

    if (!slug) {
      this.loading = false;
      this.error = 'Page introuvable.';
      return;
    }

    this.contentPagesService.getPublicPage(slug).subscribe({
      next: (page) => {
        this.loading = false;
        if (!page) {
          this.error = 'Cette page est indisponible.';
          return;
        }
        this.page = page;
      },
      error: () => {
        this.loading = false;
        this.error = 'Impossible de charger cette page.';
      },
    });
  }
}
