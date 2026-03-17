import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { ContentPage, ContentPagesService } from '../../../core/services/content-pages.service';

@Component({
  selector: 'app-content-pages-management',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatButtonModule, MatInputModule, MatSelectModule],
  template: `
    <section class="page app-shell-card">
      <header class="head">
        <div>
          <h1>Pages institutionnelles</h1>
          <p>CRUD des pages publiques, y compris la configuration editoriale de la home.</p>
        </div>
      </header>

      <div class="status ok" *ngIf="success">{{ success }}</div>
      <div class="status error" *ngIf="error">{{ error }}</div>

      <form class="editor" [formGroup]="form">
        <mat-form-field appearance="outline">
          <mat-label>Selectionner une page</mat-label>
          <mat-select formControlName="slug" (selectionChange)="loadSelectedPage()">
            <mat-option *ngFor="let slug of pageSlugs" [value]="slug">{{ slug }}</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Titre</mat-label>
          <input matInput formControlName="title" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Publication</mat-label>
          <mat-select formControlName="published">
            <mat-option [value]="true">Publiee</mat-option>
            <mat-option [value]="false">Masquee</mat-option>
          </mat-select>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sous-titre</mat-label>
          <textarea matInput rows="2" formControlName="subtitle"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Titre Hero</mat-label>
          <input matInput formControlName="heroTitle" />
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Texte Hero</mat-label>
          <textarea matInput rows="3" formControlName="heroText"></textarea>
        </mat-form-field>

        <div class="grid2">
          <mat-form-field appearance="outline">
            <mat-label>Bouton CTA (label)</mat-label>
            <input matInput formControlName="ctaLabel" />
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Bouton CTA (route/url)</mat-label>
            <input matInput formControlName="ctaUrl" />
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline">
          <mat-label>Highlights (une ligne = un item)</mat-label>
          <textarea matInput rows="4" formControlName="highlightsText"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Sections JSON</mat-label>
          <textarea matInput rows="8" formControlName="sectionsJson"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>FAQ JSON</mat-label>
          <textarea matInput rows="8" formControlName="faqJson"></textarea>
        </mat-form-field>

        <mat-form-field appearance="outline">
          <mat-label>Metadata JSON</mat-label>
          <textarea matInput rows="8" formControlName="metadataJson"></textarea>
        </mat-form-field>

        <div class="actions">
          <button type="button" mat-stroked-button (click)="createEmptyPage()">Nouvelle page</button>
          <button type="button" mat-raised-button color="primary" (click)="save()" [disabled]="saving">
            {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
          </button>
          <button type="button" mat-stroked-button class="warn" (click)="deleteCurrent()" [disabled]="saving">
            Supprimer
          </button>
        </div>
      </form>
    </section>
  `,
  styles: [`
    .page { border: 1px solid var(--line); padding: 1rem; display: grid; gap: .8rem; }
    .head h1 { margin: 0; font-size: clamp(1.4rem, 2.3vw, 2rem); }
    .head p { margin: .35rem 0 0; color: var(--ink-2); }
    .editor { display: grid; gap: .7rem; }
    .grid2 { display: grid; gap: .7rem; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); }
    .actions { display: flex; flex-wrap: wrap; gap: .6rem; }
    .warn { border-color: #c7463a; color: #c7463a; }
    .status { border-radius: 10px; padding: .6rem .7rem; font-weight: 700; }
    .status.error { background: #fff3ef; border: 1px solid #f5c5b7; color: #b92016; }
    .status.ok { background: #eefbf7; border: 1px solid #b9eadf; color: #0b6557; }
  `],
})
export class ContentPagesManagementComponent implements OnInit {
  form: ReturnType<FormBuilder['group']>;
  pages: Record<string, ContentPage> = {};
  pageSlugs: string[] = [];
  saving = false;
  error: string | null = null;
  success: string | null = null;

  constructor(
    private readonly fb: FormBuilder,
    private readonly contentPagesService: ContentPagesService,
  ) {
    this.form = this.fb.group({
      slug: ['', Validators.required],
      title: ['', Validators.required],
      published: [true, Validators.required],
      subtitle: [''],
      heroTitle: [''],
      heroText: [''],
      ctaLabel: [''],
      ctaUrl: [''],
      highlightsText: [''],
      sectionsJson: ['[]'],
      faqJson: ['[]'],
      metadataJson: ['{}'],
    });
  }

  ngOnInit(): void {
    this.loadPages();
  }

  loadSelectedPage(): void {
    const slug = String(this.form.value.slug || '');
    const page = this.pages[slug];
    if (!page) {
      return;
    }
    this.patchFormFromPage(page);
  }

  createEmptyPage(): void {
    this.error = null;
    this.success = null;
    this.form.patchValue({
      slug: '',
      title: '',
      published: true,
      subtitle: '',
      heroTitle: '',
      heroText: '',
      ctaLabel: '',
      ctaUrl: '',
      highlightsText: '',
      sectionsJson: '[]',
      faqJson: '[]',
      metadataJson: '{}',
    });
  }

  save(): void {
    this.error = null;
    this.success = null;
    const slug = String(this.form.value.slug || '').trim();
    const title = String(this.form.value.title || '').trim();

    if (!slug || !title) {
      this.error = 'Slug et titre sont obligatoires.';
      return;
    }

    let sections: any[] = [];
    let faq: any[] = [];
    let metadata: Record<string, unknown> = {};
    try {
      sections = JSON.parse(this.form.value.sectionsJson || '[]');
      faq = JSON.parse(this.form.value.faqJson || '[]');
      metadata = JSON.parse(this.form.value.metadataJson || '{}');
    } catch {
      this.error = 'JSON invalide dans Sections, FAQ ou Metadata.';
      return;
    }

    const content: ContentPage = {
      slug,
      title,
      published: this.form.value.published !== false,
      subtitle: String(this.form.value.subtitle || ''),
      heroTitle: String(this.form.value.heroTitle || ''),
      heroText: String(this.form.value.heroText || ''),
      ctaLabel: String(this.form.value.ctaLabel || ''),
      ctaUrl: String(this.form.value.ctaUrl || ''),
      highlights: String(this.form.value.highlightsText || '')
        .split('\n')
        .map((v) => v.trim())
        .filter((v) => v.length > 0),
      sections,
      faq,
      metadata,
    };

    this.saving = true;
    const request$ = this.pages[slug]
      ? this.contentPagesService.updatePage(slug, content)
      : this.contentPagesService.createPage(slug, content);

    request$.subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Page enregistree.';
        this.loadPages(slug);
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Echec de sauvegarde.';
      },
    });
  }

  deleteCurrent(): void {
    const slug = String(this.form.value.slug || '').trim();
    if (!slug) {
      this.error = 'Selectionnez une page.';
      return;
    }
    this.saving = true;
    this.contentPagesService.deletePage(slug).subscribe({
      next: () => {
        this.saving = false;
        this.success = 'Page supprimee.';
        this.loadPages();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Suppression impossible.';
      },
    });
  }

  private loadPages(preferredSlug?: string): void {
    this.contentPagesService.getAdminPages().subscribe({
      next: (pages) => {
        this.pages = pages || {};
        this.pageSlugs = Object.keys(this.pages).sort();
        const slug = preferredSlug || this.form.value.slug || this.pageSlugs[0] || '';
        if (!slug) {
          return;
        }
        this.form.patchValue({ slug });
        this.patchFormFromPage(this.pages[slug]);
      },
      error: () => {
        this.error = 'Impossible de charger les pages.';
      },
    });
  }

  private patchFormFromPage(page: ContentPage | undefined): void {
    if (!page) {
      return;
    }
    this.form.patchValue({
      slug: page.slug || '',
      title: page.title || '',
      published: page.published !== false,
      subtitle: page.subtitle || '',
      heroTitle: page.heroTitle || '',
      heroText: page.heroText || '',
      ctaLabel: page.ctaLabel || '',
      ctaUrl: page.ctaUrl || '',
      highlightsText: (page.highlights || []).join('\n'),
      sectionsJson: JSON.stringify(page.sections || [], null, 2),
      faqJson: JSON.stringify(page.faq || [], null, 2),
      metadataJson: JSON.stringify(page.metadata || {}, null, 2),
    });
  }
}
