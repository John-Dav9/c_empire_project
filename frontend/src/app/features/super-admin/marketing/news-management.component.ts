import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

interface NewsItem {
  id: string;
  title: string;
  message: string;
  isActive: boolean;
  priority: number;
  startDate?: string;
  endDate?: string;
}

@Component({
  selector: 'app-news-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="head">
        <h1>📰 Actualités</h1>
        <button class="btn btn-primary" (click)="openCreate()">+ Nouveau message</button>
      </header>

      <p *ngIf="error" class="alert">{{ error }}</p>

      <div class="list app-shell-card">
        <article class="news" *ngFor="let item of news">
          <div>
            <h3>{{ item.title }}</h3>
            <p>{{ item.message }}</p>
            <small>Priorité: {{ item.priority }} · {{ item.startDate ? (item.startDate | date:'dd/MM/yyyy') : 'immédiat' }}</small>
          </div>
          <div class="actions">
            <button class="btn btn-secondary" (click)="edit(item)">Modifier</button>
            <button class="btn btn-secondary" (click)="toggle(item)">
              {{ item.isActive ? 'Désactiver' : 'Activer' }}
            </button>
            <button class="btn btn-danger" (click)="remove(item.id)">Supprimer</button>
          </div>
        </article>
      </div>

      <div *ngIf="showModal" class="modal-overlay" (click)="close()">
        <div class="modal app-shell-card" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId ? 'Modifier' : 'Créer' }} une actualité</h2>
            <button class="close" (click)="close()">✕</button>
          </div>

          <form (ngSubmit)="save()" class="form">
            <label>Titre *</label>
            <input [(ngModel)]="form.title" name="title" required />

            <label>Message *</label>
            <textarea [(ngModel)]="form.message" name="message" rows="4" required></textarea>

            <div class="row">
              <div>
                <label>Priorité</label>
                <input type="number" min="0" [(ngModel)]="form.priority" name="priority" />
              </div>
              <div>
                <label>Active</label>
                <label class="check">
                  <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
                  Visible
                </label>
              </div>
            </div>

            <div class="row">
              <div>
                <label>Début (optionnel)</label>
                <input type="datetime-local" [(ngModel)]="form.startDate" name="startDate" />
              </div>
              <div>
                <label>Fin (optionnel)</label>
                <input type="datetime-local" [(ngModel)]="form.endDate" name="endDate" />
              </div>
            </div>

            <div class="foot">
              <button type="button" class="btn btn-secondary" (click)="close()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [`
    .page { padding: 0 2px; max-width: 1200px; margin: 0 auto; }
    .head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:.8rem; flex-wrap:wrap; }
    .head h1 { margin:0; color:var(--ink-0); }
    .alert { padding:.8rem; border-radius:10px; background:#fdecea; color:#9f2918; margin-bottom:.8rem; }
    .list { border:1px solid var(--line); border-radius:14px; padding:.5rem; }
    .news { padding:.8rem; border-bottom:1px solid var(--line); display:flex; justify-content:space-between; gap:.8rem; align-items:flex-start; }
    .news:last-child { border-bottom:none; }
    .news h3 { margin:0 0 .35rem; }
    .news p { margin:.2rem 0 .4rem; color:var(--ink-1); }
    .actions { display:flex; gap:.4rem; flex-wrap:wrap; }
    .btn { border:none; border-radius:10px; padding:.55rem .82rem; font-weight:700; cursor:pointer; }
    .btn-primary { background:var(--brand); color:#fff; }
    .btn-secondary { background:#7d6f5d; color:#fff; }
    .btn-danger { background:#b92016; color:#fff; }
    .modal-overlay { position:fixed; inset:0; background:rgba(16,11,6,.55); backdrop-filter:blur(3px); display:flex; justify-content:center; align-items:flex-start; padding:96px 1rem 1rem; z-index:4000; overflow-y:auto; }
    .modal { width:min(760px,calc(100vw - 2rem)); max-height:calc(100vh - 2rem); border:1px solid var(--line); border-radius:16px; padding:1rem; background:#fff; box-shadow:0 24px 50px rgba(0,0,0,.22); overflow-y:auto; }
    .modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:.8rem; }
    .close { width:34px; height:34px; border-radius:8px; border:1px solid var(--line); background:#fff; cursor:pointer; }
    .form { display:grid; gap:.55rem; }
    .form input, .form textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:.66rem .72rem; font-size:.95rem; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:.55rem; }
    .check { display:inline-flex; align-items:center; gap:.45rem; color:var(--ink-1); }
    .foot { margin-top:.7rem; display:flex; justify-content:flex-end; gap:.5rem; }
    @media (max-width: 760px) { .row { grid-template-columns:1fr; } .news { flex-direction:column; } }
  `],
})
export class NewsManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  news: NewsItem[] = [];
  error: string | null = null;
  showModal = false;
  saving = false;
  editingId: string | null = null;

  form = {
    title: '',
    message: '',
    isActive: true,
    priority: 0,
    startDate: '',
    endDate: '',
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = null;
    this.http.get<NewsItem[]>(buildApiUrl('/highlights/news')).subscribe({
      next: (data) => (this.news = data ?? []),
      error: (err: HttpErrorResponse) => {
        this.http.get<NewsItem[]>(buildApiUrl('/highlights/news/public/active')).subscribe({
          next: (data) => {
            this.news = data ?? [];
            this.error = this.readableError(
              err,
              'Chargement admin indisponible. Affichage des actualités publiques.',
            );
          },
          error: () => {
            this.news = [];
            this.error = this.readableError(err, 'Impossible de charger les actualités');
          },
        });
      },
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.resetForm();
    this.showModal = true;
  }

  edit(item: NewsItem): void {
    this.editingId = item.id;
    this.form = {
      title: item.title,
      message: item.message,
      isActive: item.isActive,
      priority: Number(item.priority || 0),
      startDate: this.toDateTimeLocal(item.startDate),
      endDate: this.toDateTimeLocal(item.endDate),
    };
    this.showModal = true;
  }

  toggle(item: NewsItem): void {
    this.http
      .patch(buildApiUrl(`/highlights/news/${item.id}`), {
        isActive: !item.isActive,
      })
      .subscribe({
        next: () => this.load(),
        error: () => (this.error = 'Mise à jour impossible'),
      });
  }

  remove(id: string): void {
    if (!confirm('Supprimer cette actualité ?')) return;
    this.http.delete(buildApiUrl(`/highlights/news/${id}`)).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Suppression impossible'),
    });
  }

  save(): void {
    if (!this.form.title.trim() || !this.form.message.trim()) {
      this.error = 'Titre et message sont requis.';
      return;
    }
    const payload = {
      title: this.form.title.trim(),
      message: this.form.message.trim(),
      isActive: this.form.isActive,
      priority: Number(this.form.priority || 0),
      startDate: this.form.startDate ? new Date(this.form.startDate).toISOString() : undefined,
      endDate: this.form.endDate ? new Date(this.form.endDate).toISOString() : undefined,
    };
    this.saving = true;
    const request = this.editingId
      ? this.http.patch(buildApiUrl(`/highlights/news/${this.editingId}`), payload)
      : this.http.post(buildApiUrl('/highlights/news'), payload);
    request.subscribe({
      next: () => {
        this.saving = false;
        this.close();
        this.load();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Enregistrement impossible';
      },
    });
  }

  close(): void {
    this.showModal = false;
    this.editingId = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.form = {
      title: '',
      message: '',
      isActive: true,
      priority: 0,
      startDate: '',
      endDate: '',
    };
  }

  private toDateTimeLocal(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private readableError(err: HttpErrorResponse, fallback: string): string {
    const backendMessage =
      (typeof err?.error?.message === 'string' && err.error.message) ||
      (Array.isArray(err?.error?.message) && err.error.message.join(', ')) ||
      '';
    const status = err?.status ? ` [HTTP ${err.status}]` : '';
    return backendMessage ? `${backendMessage}${status}` : `${fallback}${status}`;
  }
}
