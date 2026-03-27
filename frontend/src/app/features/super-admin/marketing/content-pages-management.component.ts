import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { FormBuilder, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import {
  ContentPage,
  ContentFaqItem,
  ContentSection,
  ContentPagesService,
} from '../../../core/services/content-pages.service';

type EditorTab = 'general' | 'hero' | 'highlights' | 'sections' | 'faq' | 'meta';

@Component({
  selector: 'app-content-pages-management',
  imports: [ReactiveFormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="crm-layout">

      <!-- ─── LEFT PANEL: Page list ─── -->
      <aside class="pages-panel">
        <div class="pages-panel-header">
          <div class="panel-title">Pages du site</div>
          <button type="button" class="btn-new" (click)="openNewPageForm()">+ Nouvelle</button>
        </div>

        @if (showNewPageForm()) {
          <div class="new-page-form">
            <div class="new-page-title">Créer une page</div>
            <label class="np-field">
              <span>Slug (identifiant URL)</span>
              <input
                type="text"
                [value]="newSlugDraft()"
                (input)="newSlugDraft.set($any($event.target).value)"
                placeholder="ex: a-propos"
                (keydown.enter)="confirmNewPage()"
              />
            </label>
            @if (newPageError()) {
              <div class="np-error">{{ newPageError() }}</div>
            }
            <div class="np-actions">
              <button type="button" class="btn-outline-sm" (click)="cancelNewPage()">Annuler</button>
              <button type="button" class="btn-primary-sm" (click)="confirmNewPage()">Créer</button>
            </div>
          </div>
        }

        @if (loading()) {
          <div class="panel-loading">Chargement...</div>
        } @else if (pageSlugs().length === 0) {
          <div class="panel-empty">Aucune page. Créez-en une.</div>
        } @else {
          <ul class="page-list" role="list">
            @for (slug of pageSlugs(); track slug) {
              <li>
                <button
                  type="button"
                  class="page-item"
                  [class.active]="selectedSlug() === slug"
                  (click)="selectPage(slug)"
                >
                  <div class="page-item-slug">{{ slug }}</div>
                  <div class="page-item-title">{{ pages()[slug]?.title || '—' }}</div>
                  <div
                    class="status-dot"
                    [class.published]="pages()[slug]?.published !== false"
                    [attr.title]="pages()[slug]?.published !== false ? 'Publiée' : 'Masquée'"
                  ></div>
                </button>
              </li>
            }
          </ul>
        }
      </aside>

      <!-- ─── RIGHT PANEL: Editor ─── -->
      <main class="editor-panel">

        @if (!selectedSlug() && !loading()) {
          <div class="empty-state">
            <div class="empty-icon">📄</div>
            <div class="empty-title">Sélectionnez une page</div>
            <p>Choisissez une page dans la liste ou créez-en une nouvelle.</p>
          </div>
        }

        @if (selectedSlug()) {
          <div class="editor-header">
            <div class="editor-title">
              <div class="slug-badge">{{ selectedSlug() }}</div>
              <h1>{{ form.value.title || 'Page sans titre' }}</h1>
            </div>
            <div class="editor-actions">
              @if (isExistingPage()) {
                <button type="button" class="btn btn-danger-outline" (click)="deletePage()" [disabled]="saving()">
                  🗑 Supprimer
                </button>
              }
              <button type="button" class="btn btn-primary" (click)="save()" [disabled]="saving()">
                @if (saving()) { Enregistrement... } @else { Enregistrer }
              </button>
            </div>
          </div>

          @if (error()) {
            <div class="alert alert-error" role="alert">⚠️ {{ error() }}</div>
          }
          @if (success()) {
            <div class="alert alert-success" role="alert">✅ {{ success() }}</div>
          }

          <!-- Editor Tabs -->
          <nav class="tab-nav" aria-label="Sections de la page">
            @for (tab of editorTabs; track tab.id) {
              <button
                type="button"
                class="tab-btn"
                [class.active]="activeTab() === tab.id"
                (click)="activeTab.set(tab.id)"
              >
                <span>{{ tab.icon }}</span> {{ tab.label }}
              </button>
            }
          </nav>

          <form [formGroup]="form" class="editor-form">

            <!-- ─── GÉNÉRAL ─── -->
            @if (activeTab() === 'general') {
              <div class="form-section">
                <div class="form-grid-2">
                  <label class="field">
                    <span class="field-label">Slug (URL)</span>
                    <input formControlName="slug" [attr.readonly]="isExistingPage() ? true : null" placeholder="ex: a-propos" />
                  </label>
                  <label class="field">
                    <span class="field-label">Titre de la page</span>
                    <input formControlName="title" placeholder="Ex: À propos de nous" />
                  </label>
                </div>
                <label class="field">
                  <span class="field-label">Sous-titre</span>
                  <input formControlName="subtitle" placeholder="Texte sous le titre principal..." />
                </label>
                <div class="toggle-row">
                  <span class="field-label">Statut de publication</span>
                  <label class="toggle-switch" [attr.aria-label]="form.value.published ? 'Publiée' : 'Masquée'">
                    <input type="checkbox" formControlName="published" />
                    <span class="toggle-track"></span>
                  </label>
                  <span class="toggle-label" [class.published]="form.value.published">
                    {{ form.value.published ? '✅ Publiée' : '🚫 Masquée' }}
                  </span>
                </div>
              </div>
            }

            <!-- ─── HERO & CTA ─── -->
            @if (activeTab() === 'hero') {
              <div class="form-section">
                <label class="field">
                  <span class="field-label">Titre du hero</span>
                  <input formControlName="heroTitle" placeholder="Grand titre accrocheur de la section hero..." />
                </label>
                <label class="field">
                  <span class="field-label">Texte du hero</span>
                  <textarea formControlName="heroText" rows="4" placeholder="Description ou accroche du hero..."></textarea>
                </label>
                <div class="form-grid-2">
                  <label class="field">
                    <span class="field-label">Bouton CTA — Libellé</span>
                    <input formControlName="ctaLabel" placeholder="Ex: Découvrir nos services" />
                  </label>
                  <label class="field">
                    <span class="field-label">Bouton CTA — URL / Route</span>
                    <input formControlName="ctaUrl" placeholder="/services ou https://..." />
                  </label>
                </div>
              </div>
            }

            <!-- ─── POINTS CLÉS ─── -->
            @if (activeTab() === 'highlights') {
              <div class="form-section">
                <div class="subsection-head">
                  <div>
                    <h3>Points clés</h3>
                    <p>Arguments forts ou avantages affichés en avant de la page.</p>
                  </div>
                  <button type="button" class="btn-add" (click)="addHighlight()">+ Ajouter</button>
                </div>
                <div formArrayName="highlights" class="highlights-list">
                  @for (h of highlightsArray.controls; track $index; let hi = $index) {
                    <div class="highlight-item">
                      <span class="highlight-num">{{ hi + 1 }}</span>
                      <input [formControlName]="hi" class="input-highlight" placeholder="Ex: Livraison en 24h" />
                      <button type="button" class="icon-btn-sm danger" (click)="removeHighlight(hi)" aria-label="Supprimer">×</button>
                    </div>
                  }
                  @if (highlightsArray.length === 0) {
                    <div class="list-empty">Aucun point clé. Cliquez sur "+ Ajouter".</div>
                  }
                </div>
              </div>
            }

            <!-- ─── SECTIONS ─── -->
            @if (activeTab() === 'sections') {
              <div class="form-section">
                <div class="subsection-head">
                  <div>
                    <h3>Sections de contenu</h3>
                    <p>Blocs de texte affichés sur la page (titre + corps).</p>
                  </div>
                  <button type="button" class="btn-add" (click)="addSection()">+ Section</button>
                </div>
                <div formArrayName="sections" class="sections-list">
                  @for (sec of sectionsArray.controls; track $index; let si = $index) {
                    <div class="section-card" [formGroupName]="si">
                      <div class="section-card-header">
                        <span class="section-num">Section {{ si + 1 }}</span>
                        <button type="button" class="icon-btn danger" (click)="removeSection(si)" aria-label="Supprimer la section">🗑</button>
                      </div>
                      <label class="field">
                        <span class="field-label">Titre</span>
                        <input formControlName="title" placeholder="Titre de la section..." />
                      </label>
                      <label class="field">
                        <span class="field-label">Corps du texte</span>
                        <textarea formControlName="body" rows="5" placeholder="Contenu de la section..."></textarea>
                      </label>
                    </div>
                  }
                  @if (sectionsArray.length === 0) {
                    <div class="list-empty">Aucune section. Cliquez sur "+ Section".</div>
                  }
                </div>
              </div>
            }

            <!-- ─── FAQ ─── -->
            @if (activeTab() === 'faq') {
              <div class="form-section">
                <div class="subsection-head">
                  <div>
                    <h3>Questions fréquentes (FAQ)</h3>
                    <p>Paires question / réponse à afficher sur la page.</p>
                  </div>
                  <button type="button" class="btn-add" (click)="addFaq()">+ Question</button>
                </div>
                <div formArrayName="faq" class="sections-list">
                  @for (item of faqArray.controls; track $index; let fi = $index) {
                    <div class="section-card" [formGroupName]="fi">
                      <div class="section-card-header">
                        <span class="section-num">Q{{ fi + 1 }}</span>
                        <button type="button" class="icon-btn danger" (click)="removeFaq(fi)" aria-label="Supprimer">🗑</button>
                      </div>
                      <label class="field">
                        <span class="field-label">Question</span>
                        <input formControlName="question" placeholder="Question fréquente..." />
                      </label>
                      <label class="field">
                        <span class="field-label">Réponse</span>
                        <textarea formControlName="answer" rows="4" placeholder="Réponse détaillée..."></textarea>
                      </label>
                    </div>
                  }
                  @if (faqArray.length === 0) {
                    <div class="list-empty">Aucune entrée FAQ. Cliquez sur "+ Question".</div>
                  }
                </div>
              </div>
            }

            <!-- ─── MÉTADONNÉES ─── -->
            @if (activeTab() === 'meta') {
              <div class="form-section">
                <div class="subsection-head">
                  <div>
                    <h3>Métadonnées JSON</h3>
                    <p>Données techniques supplémentaires pour la page (SEO, config avancée...).</p>
                  </div>
                </div>
                <label class="field">
                  <span class="field-label">Objet JSON</span>
                  <textarea formControlName="metadataJson" rows="14" class="json-area"></textarea>
                </label>
              </div>
            }

          </form>
        }
      </main>
    </div>
  `,
  styles: [`
    /* ── Layout ── */
    .crm-layout { display: grid; grid-template-columns: 260px 1fr; height: 100%; min-height: 80vh; background: #f4f6f9; }

    /* ── Left panel ── */
    .pages-panel { background: #fff; border-right: 1px solid #e5e7eb; display: flex; flex-direction: column; overflow: hidden; }
    .pages-panel-header { display: flex; justify-content: space-between; align-items: center; padding: 16px; border-bottom: 1px solid #e5e7eb; }
    .panel-title { font-weight: 700; font-size: .9rem; color: #374151; text-transform: uppercase; letter-spacing: .06em; }
    .btn-new { height: 30px; padding: 0 12px; border-radius: 7px; background: #d05a2d; color: #fff; border: none; font-size: .78rem; font-weight: 700; cursor: pointer; }
    .btn-new:hover { background: #b94d24; }

    /* New page form */
    .new-page-form { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; background: #fff8f5; display: grid; gap: 10px; }
    .new-page-title { font-size: .82rem; font-weight: 700; color: #d05a2d; }
    .np-field { display: grid; gap: 5px; font-size: .78rem; font-weight: 700; color: #374151; }
    .np-field input { height: 34px; padding: 0 10px; border: 1px solid #d1d5db; border-radius: 7px; font-size: .82rem; box-sizing: border-box; width: 100%; }
    .np-field input:focus { outline: none; border-color: #d05a2d; }
    .np-error { font-size: .78rem; color: #b92016; font-weight: 600; }
    .np-actions { display: flex; gap: 8px; justify-content: flex-end; }
    .btn-outline-sm { height: 30px; padding: 0 12px; border-radius: 7px; background: #fff; border: 1px solid #d1d5db; color: #374151; font-size: .78rem; font-weight: 600; cursor: pointer; }
    .btn-primary-sm { height: 30px; padding: 0 12px; border-radius: 7px; background: #d05a2d; color: #fff; border: none; font-size: .78rem; font-weight: 600; cursor: pointer; }

    .panel-loading { padding: 20px 16px; color: #9ca3af; font-size: .875rem; }
    .panel-empty { padding: 20px 16px; color: #9ca3af; font-size: .875rem; text-align: center; }

    .page-list { list-style: none; margin: 0; padding: 8px; overflow-y: auto; flex: 1; }
    .page-item { width: 100%; background: transparent; border: none; border-radius: 8px; padding: 10px 12px; text-align: left; cursor: pointer; display: grid; grid-template-columns: 1fr 16px; gap: 2px 8px; transition: background .15s; align-items: start; }
    .page-item:hover { background: #f3f4f6; }
    .page-item.active { background: #fff5f0; }
    .page-item-slug { font-size: .75rem; font-weight: 700; color: #9ca3af; text-transform: lowercase; letter-spacing: .04em; grid-row: 1; grid-column: 1; }
    .page-item-title { font-size: .875rem; font-weight: 600; color: #1a2332; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; grid-row: 2; grid-column: 1; }
    .status-dot { width: 8px; height: 8px; border-radius: 50%; background: #d1d5db; margin-top: 4px; grid-row: 1; grid-column: 2; }
    .status-dot.published { background: #22c55e; }

    /* ── Right panel ── */
    .editor-panel { display: flex; flex-direction: column; overflow: hidden; }

    /* Empty state */
    .empty-state { display: flex; flex-direction: column; align-items: center; justify-content: center; height: 100%; gap: 12px; color: #9ca3af; padding: 60px 20px; text-align: center; }
    .empty-icon { font-size: 3rem; }
    .empty-title { font-size: 1.2rem; font-weight: 700; color: #374151; }
    .empty-state p { color: #9ca3af; max-width: 300px; }

    /* Editor header */
    .editor-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 16px; flex-wrap: wrap; padding: 20px 24px; border-bottom: 1px solid #e5e7eb; background: #fff; }
    .editor-title { display: grid; gap: 4px; }
    .slug-badge { font-size: .72rem; font-weight: 700; color: #6b7280; text-transform: lowercase; background: #f3f4f6; border: 1px solid #e5e7eb; border-radius: 5px; padding: 2px 8px; display: inline-block; }
    .editor-title h1 { margin: 0; font-size: clamp(1.1rem, 2vw, 1.5rem); font-weight: 700; color: #1a2332; }
    .editor-actions { display: flex; gap: 10px; align-items: center; }

    /* Buttons */
    .btn { height: 38px; padding: 0 18px; border-radius: 8px; font-size: .875rem; font-weight: 600; cursor: pointer; border: none; transition: all .15s; }
    .btn-primary { background: #d05a2d; color: #fff; }
    .btn-primary:hover:not(:disabled) { background: #b94d24; }
    .btn-primary:disabled { opacity: .5; cursor: not-allowed; }
    .btn-danger-outline { background: transparent; color: #dc2626; border: 1px solid #fca5a5; }
    .btn-danger-outline:hover:not(:disabled) { background: #fff5f5; border-color: #dc2626; }
    .btn-danger-outline:disabled { opacity: .5; cursor: not-allowed; }
    .btn-add { height: 34px; padding: 0 14px; border-radius: 8px; background: #fff; border: 1px dashed #d05a2d; color: #d05a2d; font-size: .82rem; font-weight: 700; cursor: pointer; white-space: nowrap; }
    .btn-add:hover { background: #fff5f0; }
    .icon-btn { width: 30px; height: 30px; border-radius: 6px; border: none; cursor: pointer; display: grid; place-items: center; font-size: .85rem; transition: all .15s; }
    .icon-btn.danger { background: #fff5f5; color: #dc2626; }
    .icon-btn.danger:hover { background: #fee2e2; }
    .icon-btn-sm { width: 24px; height: 24px; border-radius: 5px; border: none; cursor: pointer; display: grid; place-items: center; font-size: .85rem; transition: all .15s; flex-shrink: 0; }
    .icon-btn-sm.danger { background: #fff5f5; color: #dc2626; }
    .icon-btn-sm.danger:hover { background: #fee2e2; }

    /* Alerts */
    .alert { margin: 0 24px; border-radius: 10px; padding: 10px 14px; font-weight: 600; font-size: .875rem; display: flex; align-items: center; gap: 8px; }
    .alert-error { background: #fff3ef; border: 1px solid #f5c5b7; color: #b92016; }
    .alert-success { background: #eefbf7; border: 1px solid #b9eadf; color: #0b6557; }

    /* Tabs */
    .tab-nav { display: flex; gap: 2px; padding: 10px 24px 0; background: #fff; border-bottom: 1px solid #e5e7eb; overflow-x: auto; }
    .tab-btn { display: flex; align-items: center; gap: 6px; height: 38px; padding: 0 14px; border: none; background: transparent; color: #6b7280; font-size: .82rem; font-weight: 600; cursor: pointer; border-bottom: 2px solid transparent; margin-bottom: -1px; transition: all .15s; white-space: nowrap; }
    .tab-btn:hover { color: #374151; }
    .tab-btn.active { color: #d05a2d; border-bottom-color: #d05a2d; }

    /* Form */
    .editor-form { flex: 1; overflow-y: auto; padding: 20px 24px; }
    .form-section { display: grid; gap: 18px; }
    .form-grid-2 { display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 16px; }
    .field { display: grid; gap: 6px; }
    .field-label { font-size: .78rem; font-weight: 700; color: #374151; text-transform: uppercase; letter-spacing: .04em; }
    .subsection-head { display: flex; justify-content: space-between; align-items: flex-start; gap: 12px; }
    .subsection-head h3 { margin: 0; font-size: 1rem; font-weight: 700; color: #1a2332; }
    .subsection-head p { margin: 4px 0 0; color: #6b7280; font-size: .82rem; }

    input, textarea { height: 40px; padding: 0 12px; border: 1px solid #d1d5db; border-radius: 8px; font-size: .875rem; color: #1a2332; background: #fff; transition: border-color .15s; width: 100%; box-sizing: border-box; }
    input:focus, textarea:focus { outline: none; border-color: #d05a2d; box-shadow: 0 0 0 3px rgba(208,90,45,.1); }
    input[readonly] { background: #f3f4f6; color: #6b7280; cursor: not-allowed; }
    textarea { height: auto; padding: 10px 12px; resize: vertical; }
    .json-area { font-family: Consolas, Monaco, monospace; font-size: .82rem; background: #0f1724; color: #d8e3f2; border-color: #374151; }

    /* Toggle switch */
    .toggle-row { display: flex; align-items: center; gap: 12px; }
    .toggle-switch { position: relative; display: inline-block; width: 44px; height: 24px; cursor: pointer; }
    .toggle-switch input { opacity: 0; width: 0; height: 0; position: absolute; }
    .toggle-track { position: absolute; inset: 0; background: #d1d5db; border-radius: 12px; transition: background .2s; }
    .toggle-track::after { content: ''; position: absolute; width: 18px; height: 18px; border-radius: 50%; background: #fff; top: 3px; left: 3px; transition: transform .2s; }
    .toggle-switch input:checked ~ .toggle-track { background: #22c55e; }
    .toggle-switch input:checked ~ .toggle-track::after { transform: translateX(20px); }
    .toggle-label { font-size: .875rem; font-weight: 600; color: #9ca3af; }
    .toggle-label.published { color: #22c55e; }

    /* Highlights */
    .highlights-list { display: grid; gap: 8px; }
    .highlight-item { display: flex; align-items: center; gap: 10px; }
    .highlight-num { width: 26px; height: 26px; border-radius: 50%; background: #d05a2d; color: #fff; font-size: .75rem; font-weight: 700; display: grid; place-items: center; flex-shrink: 0; }
    .input-highlight { flex: 1; height: 38px; padding: 0 12px; border: 1px solid #e5e7eb; border-radius: 8px; font-size: .875rem; }
    .input-highlight:focus { outline: none; border-color: #d05a2d; }

    /* Sections & FAQ */
    .sections-list { display: grid; gap: 14px; }
    .section-card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 12px; padding: 16px; display: grid; gap: 12px; }
    .section-card-header { display: flex; justify-content: space-between; align-items: center; }
    .section-num { font-size: .78rem; font-weight: 700; color: #6b7280; text-transform: uppercase; letter-spacing: .06em; }

    /* Empty list state */
    .list-empty { padding: 24px; text-align: center; color: #9ca3af; background: #f9fafb; border: 1px dashed #d1d5db; border-radius: 10px; font-size: .875rem; }

    /* Responsive */
    @media (max-width: 900px) {
      .crm-layout { grid-template-columns: 1fr; grid-template-rows: auto 1fr; }
      .pages-panel { border-right: none; border-bottom: 1px solid #e5e7eb; max-height: 260px; }
      .page-list { display: flex; flex-wrap: nowrap; overflow-x: auto; padding: 8px; gap: 6px; }
      .page-item { width: auto; min-width: 120px; grid-template-columns: 1fr; }
      .status-dot { display: none; }
    }
    @media (max-width: 600px) {
      .editor-header, .tab-nav, .editor-form { padding-left: 14px; padding-right: 14px; }
      .alert { margin: 0 14px; }
    }
  `],
})
export class ContentPagesManagementComponent implements OnInit {
  private readonly fb = inject(FormBuilder);
  private readonly svc = inject(ContentPagesService);

  readonly loading = signal(true);
  readonly saving = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal<string | null>(null);
  readonly activeTab = signal<EditorTab>('general');
  readonly selectedSlug = signal<string | null>(null);
  readonly showNewPageForm = signal(false);
  readonly newSlugDraft = signal('');
  readonly newPageError = signal<string | null>(null);

  readonly pages = signal<Record<string, ContentPage>>({});
  readonly pageSlugs = computed(() => Object.keys(this.pages()).sort());
  readonly isExistingPage = computed(() => {
    const slug = this.selectedSlug();
    return !!slug && !!this.pages()[slug];
  });

  readonly editorTabs: { id: EditorTab; label: string; icon: string }[] = [
    { id: 'general',    label: 'Général',     icon: '📋' },
    { id: 'hero',       label: 'Hero & CTA',  icon: '🦸' },
    { id: 'highlights', label: 'Points clés', icon: '⭐' },
    { id: 'sections',   label: 'Sections',    icon: '📄' },
    { id: 'faq',        label: 'FAQ',         icon: '❓' },
    { id: 'meta',       label: 'Métadonnées', icon: '🔧' },
  ];

  readonly form = this.fb.group({
    slug:         ['', Validators.required],
    title:        ['', Validators.required],
    published:    [true],
    subtitle:     [''],
    heroTitle:    [''],
    heroText:     [''],
    ctaLabel:     [''],
    ctaUrl:       [''],
    highlights:   this.fb.array([]),
    sections:     this.fb.array([]),
    faq:          this.fb.array([]),
    metadataJson: ['{}'],
  });

  get highlightsArray(): FormArray { return this.form.get('highlights') as FormArray; }
  get sectionsArray(): FormArray   { return this.form.get('sections') as FormArray; }
  get faqArray(): FormArray        { return this.form.get('faq') as FormArray; }

  ngOnInit(): void { this.loadPages(); }

  loadPages(preferredSlug?: string): void {
    this.svc.getAdminPages().subscribe({
      next: (data) => {
        this.pages.set(data || {});
        this.loading.set(false);
        const slugs = Object.keys(data || {}).sort();
        const target = preferredSlug || this.selectedSlug() || slugs[0];
        if (target && (data || {})[target]) {
          this.selectPage(target);
        }
      },
      error: () => {
        this.error.set('Impossible de charger les pages.');
        this.loading.set(false);
      },
    });
  }

  selectPage(slug: string): void {
    this.selectedSlug.set(slug);
    this.error.set(null);
    this.success.set(null);
    this.activeTab.set('general');
    this.patchFormFromPage(this.pages()[slug]);
  }

  openNewPageForm(): void {
    this.showNewPageForm.set(true);
    this.newSlugDraft.set('');
    this.newPageError.set(null);
  }

  cancelNewPage(): void {
    this.showNewPageForm.set(false);
    this.newPageError.set(null);
  }

  confirmNewPage(): void {
    const slug = this.newSlugDraft().trim().toLowerCase().replace(/\s+/g, '-');
    if (!slug) { this.newPageError.set('Le slug est obligatoire.'); return; }
    if (this.pages()[slug]) { this.newPageError.set('Ce slug est déjà utilisé.'); return; }

    this.showNewPageForm.set(false);
    this.newPageError.set(null);
    this.selectedSlug.set(slug);
    this.resetForm();
    this.form.patchValue({ slug });
    this.activeTab.set('general');
    this.error.set(null);
    this.success.set(null);
  }

  addHighlight(): void { this.highlightsArray.push(this.fb.control('')); }
  removeHighlight(i: number): void { this.highlightsArray.removeAt(i); }

  addSection(): void  { this.sectionsArray.push(this.fb.group({ title: [''], body: [''] })); }
  removeSection(i: number): void { this.sectionsArray.removeAt(i); }

  addFaq(): void  { this.faqArray.push(this.fb.group({ question: [''], answer: [''] })); }
  removeFaq(i: number): void { this.faqArray.removeAt(i); }

  save(): void {
    this.error.set(null);
    this.success.set(null);

    const v = this.form.getRawValue();
    const slug = v.slug?.trim() ?? '';
    const title = v.title?.trim() ?? '';

    if (!slug || !title) { this.error.set('Le slug et le titre sont obligatoires.'); return; }

    let metadata: Record<string, unknown> = {};
    try {
      metadata = JSON.parse(v.metadataJson || '{}');
    } catch {
      this.error.set('Les métadonnées JSON sont invalides.'); return;
    }

    const content: ContentPage = {
      slug,
      title,
      published: v.published !== false,
      subtitle:  v.subtitle  || '',
      heroTitle: v.heroTitle || '',
      heroText:  v.heroText  || '',
      ctaLabel:  v.ctaLabel  || '',
      ctaUrl:    v.ctaUrl    || '',
      highlights: ((v.highlights || []) as string[]).filter((h) => h.trim()),
      sections:   ((v.sections || []) as ContentSection[]),
      faq:        ((v.faq || []) as ContentFaqItem[]),
      metadata,
    };

    this.saving.set(true);
    const req$ = this.isExistingPage()
      ? this.svc.updatePage(slug, content)
      : this.svc.createPage(slug, content);

    req$.subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Page enregistrée avec succès.');
        this.loadPages(slug);
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Échec de la sauvegarde.');
      },
    });
  }

  deletePage(): void {
    const slug = this.selectedSlug();
    if (!slug || !this.pages()[slug]) return;

    this.saving.set(true);
    this.svc.deletePage(slug).subscribe({
      next: () => {
        this.saving.set(false);
        this.success.set('Page supprimée.');
        this.selectedSlug.set(null);
        this.loadPages();
      },
      error: (err) => {
        this.saving.set(false);
        this.error.set(err?.error?.message || 'Suppression impossible.');
      },
    });
  }

  private resetForm(): void {
    this.highlightsArray.clear();
    this.sectionsArray.clear();
    this.faqArray.clear();
    this.form.reset({ slug: '', title: '', published: true, subtitle: '', heroTitle: '', heroText: '', ctaLabel: '', ctaUrl: '', metadataJson: '{}' });
  }

  private patchFormFromPage(page: ContentPage | undefined): void {
    if (!page) return;
    this.highlightsArray.clear();
    this.sectionsArray.clear();
    this.faqArray.clear();
    (page.highlights || []).forEach((h) => this.highlightsArray.push(this.fb.control(h)));
    (page.sections || []).forEach((s) => this.sectionsArray.push(this.fb.group({ title: [s.title], body: [s.body] })));
    (page.faq || []).forEach((f) => this.faqArray.push(this.fb.group({ question: [f.question], answer: [f.answer] })));
    this.form.patchValue({
      slug:         page.slug        || '',
      title:        page.title       || '',
      published:    page.published   !== false,
      subtitle:     page.subtitle    || '',
      heroTitle:    page.heroTitle   || '',
      heroText:     page.heroText    || '',
      ctaLabel:     page.ctaLabel    || '',
      ctaUrl:       page.ctaUrl      || '',
      metadataJson: JSON.stringify(page.metadata || {}, null, 2),
    });
  }
}
