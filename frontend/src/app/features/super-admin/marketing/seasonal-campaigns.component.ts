import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';
import { finalize, timeout } from 'rxjs';

interface CampaignItem {
  sector: string;
  title: string;
  route: string;
  description?: string;
  imageUrl?: string;
}

interface SeasonalCampaign {
  id: string;
  title: string;
  festivalName: string;
  tabLabel?: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  items: CampaignItem[];
}

@Component({
  selector: 'app-seasonal-campaigns',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page">
      <header class="head">
        <h1>🎉 Campagnes Fêtes / À la Une</h1>
        <button class="btn btn-primary" (click)="openCreate()">+ Nouvelle campagne</button>
      </header>

      <p *ngIf="error" class="alert">{{ error }}</p>
      <p *ngIf="success" class="alert success">{{ success }}</p>

      <div class="cards">
        <article class="card app-shell-card" *ngFor="let campaign of campaigns">
          <h3>{{ campaign.title }}</h3>
          <p class="meta">{{ campaign.festivalName }} · {{ campaign.startDate | date:'dd/MM/yyyy' }} - {{ campaign.endDate | date:'dd/MM/yyyy' }}</p>
          <p class="meta">Onglet: {{ campaign.tabLabel || ('Spéciale ' + campaign.festivalName) }}</p>
          <p class="meta">{{ campaign.items.length || 0 }} mise(s) en avant</p>
          <p class="meta status" [class.active]="campaign.isActive">
            Statut: {{ campaign.isActive ? 'Active' : 'Inactive' }}
          </p>
          <div class="actions">
            <button class="btn btn-secondary" (click)="edit(campaign)">Modifier</button>
            <button class="btn btn-secondary" (click)="toggle(campaign)" [disabled]="togglingId === campaign.id">
              {{
                togglingId === campaign.id
                  ? 'Mise à jour...'
                  : (campaign.isActive ? 'Désactiver' : 'Activer')
              }}
            </button>
            <button class="btn btn-danger" (click)="remove(campaign.id)">Supprimer</button>
          </div>
        </article>
      </div>

      <div *ngIf="showModal" class="modal-overlay" (click)="close()">
        <div class="modal app-shell-card" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId ? 'Modifier' : 'Créer' }} une campagne</h2>
            <button class="close" (click)="close()">✕</button>
          </div>

          <form (ngSubmit)="save()" class="form">
            <label>Titre *</label>
            <input [(ngModel)]="form.title" name="title" required />

            <label>Nom de la fête *</label>
            <input [(ngModel)]="form.festivalName" name="festivalName" required />

            <label>Libellé onglet (optionnel)</label>
            <input [(ngModel)]="form.tabLabel" name="tabLabel" placeholder="À la une / Spéciale Noël..." />

            <div class="row">
              <div>
                <label>Date début *</label>
                <input type="datetime-local" [(ngModel)]="form.startDate" name="startDate" required />
              </div>
              <div>
                <label>Date fin *</label>
                <input type="datetime-local" [(ngModel)]="form.endDate" name="endDate" required />
              </div>
            </div>

            <label class="check">
              <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
              Active
            </label>

            <div class="composition">
              <div class="composition-head">
                <h3>Mises en avant (packs/offres secteurs)</h3>
                <button type="button" class="btn btn-secondary" (click)="addItem()">+ Item</button>
              </div>
              <div class="item-row" *ngFor="let item of form.items; let i = index; trackBy: trackByIndex">
                <select [(ngModel)]="item.sector" [name]="'sector-'+i" (ngModelChange)="onItemSectorChange(item)">
                  <option value="">Secteur...</option>
                  <option value="shop">C'Shop</option>
                  <option value="grill">C'Grill</option>
                  <option value="express">C'Express</option>
                  <option value="clean">C'Clean</option>
                  <option value="events">C'Events</option>
                  <option value="todo">C'Todo</option>
                </select>
                <input [(ngModel)]="item.title" [name]="'title-'+i" placeholder="Titre item" />
                <input [(ngModel)]="item.route" [name]="'route-'+i" placeholder="/shop /grill ..." />
                <input [(ngModel)]="item.imageUrl" [name]="'img-'+i" placeholder="Image URL (optionnel)" />
                <button type="button" class="btn btn-danger" (click)="removeItem(i)">Retirer</button>
                <small class="item-hint" *ngIf="!isRouteValid(item.route)">
                  Route invalide. Exemple: {{ routeExample(item.sector) }}
                </small>
              </div>
            </div>

            <div class="foot">
              <span class="submit-status error" *ngIf="submitError">{{ submitError }}</span>
              <span class="submit-status success" *ngIf="submitSuccess">{{ submitSuccess }}</span>
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
    .page { padding: 0 2px; max-width: 1400px; margin: 0 auto; }
    .head { display:flex; justify-content:space-between; align-items:center; margin-bottom:1rem; gap:.8rem; flex-wrap:wrap; }
    .head h1 { margin:0; color:var(--ink-0); }
    .alert { padding:.8rem; border-radius:10px; background:#fdecea; color:#9f2918; margin-bottom:.8rem; }
    .alert.success { background:#e9f8f1; color:#0d6b4a; }
    .cards { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:.8rem; }
    .card { border:1px solid var(--line); border-radius:14px; padding:1rem; }
    .card h3 { margin:0 0 .35rem; }
    .meta { margin:.2rem 0; color:var(--ink-1); font-size:.9rem; }
    .status { font-weight:700; }
    .status.active { color:#0d6b4a; }
    .actions { display:flex; gap:.4rem; flex-wrap:wrap; margin-top:.7rem; }
    .btn { border:none; border-radius:10px; padding:.55rem .82rem; font-weight:700; cursor:pointer; }
    .btn-primary { background:var(--brand); color:#fff; }
    .btn-secondary { background:#7d6f5d; color:#fff; }
    .btn-danger { background:#b92016; color:#fff; }
    .modal-overlay { position:fixed; inset:0; background:rgba(16,11,6,.55); backdrop-filter:blur(3px); display:flex; justify-content:center; align-items:flex-start; padding:96px 1rem 1rem; z-index:4000; overflow-y:auto; }
    .modal { width:min(920px,calc(100vw - 2rem)); max-height:calc(100vh - 2rem); border:1px solid var(--line); border-radius:16px; padding:1rem; background:#fff; box-shadow:0 24px 50px rgba(0,0,0,.22); overflow-y:auto; }
    .modal-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:.8rem; }
    .close { width:34px; height:34px; border-radius:8px; border:1px solid var(--line); background:#fff; cursor:pointer; }
    .form { display:grid; gap:.55rem; }
    .form input, .form select, .form textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:.66rem .72rem; font-size:.95rem; }
    .row { display:grid; grid-template-columns:1fr 1fr; gap:.55rem; }
    .check { display:inline-flex; align-items:center; gap:.45rem; color:var(--ink-1); }
    .composition { margin-top:.5rem; border:1px solid var(--line); border-radius:10px; padding:.7rem; }
    .composition-head { display:flex; justify-content:space-between; align-items:center; margin-bottom:.6rem; }
    .composition-head h3 { margin:0; font-size:1rem; }
    .item-row { display:grid; grid-template-columns:140px 1fr 180px 1fr auto; gap:.45rem; align-items:center; margin-bottom:.45rem; }
    .item-hint { grid-column:1 / -1; color:#9f2918; font-size:.8rem; font-weight:700; }
    .foot { margin-top:.7rem; display:flex; justify-content:flex-end; align-items:center; gap:.5rem; flex-wrap:wrap; }
    .submit-status { margin-right:auto; font-weight:700; font-size:.9rem; }
    .submit-status.error { color:#9f2918; }
    .submit-status.success { color:#0d6b4a; }
    @media (max-width: 920px) { .row, .item-row { grid-template-columns:1fr; } }
  `],
})
export class SeasonalCampaignsComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly sectorRouteDefaults: Record<string, string> = {
    shop: '/shop',
    grill: '/grill',
    express: '/express',
    clean: '/clean',
    events: '/events',
    todo: '/todo',
  };
  private readonly allowedRoutePrefixes = [
    '/',
    '/shop',
    '/grill',
    '/express',
    '/clean',
    '/events',
    '/todo',
    '/profile',
    '/client',
    '/admin',
    '/employee',
    '/super-admin',
    '/payments',
    '/auth',
  ];
  campaigns: SeasonalCampaign[] = [];
  error: string | null = null;
  success: string | null = null;
  submitError: string | null = null;
  submitSuccess: string | null = null;
  showModal = false;
  saving = false;
  togglingId: string | null = null;
  editingId: string | null = null;

  form = {
    title: '',
    festivalName: '',
    tabLabel: '',
    startDate: '',
    endDate: '',
    isActive: true,
    items: [{ sector: '', title: '', route: '', imageUrl: '' }] as CampaignItem[],
  };

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = null;
    this.http.get<SeasonalCampaign[]>(buildApiUrl('/highlights/campaigns')).subscribe({
      next: (data) => (this.campaigns = data ?? []),
      error: (err: HttpErrorResponse) => {
        this.http
          .get<SeasonalCampaign[]>(
            buildApiUrl('/highlights/campaigns/public/active'),
          )
          .subscribe({
            next: (data) => {
              this.campaigns = data ?? [];
              this.error = this.readableError(
                err,
                "Chargement admin indisponible. Affichage des campagnes publiques.",
              );
            },
            error: () => {
              this.campaigns = [];
              this.error = this.readableError(
                err,
                'Impossible de charger les campagnes',
              );
            },
          });
      },
    });
  }

  openCreate(): void {
    this.editingId = null;
    this.resetForm();
    this.submitError = null;
    this.submitSuccess = null;
    this.showModal = true;
  }

  edit(campaign: SeasonalCampaign): void {
    this.editingId = campaign.id;
    this.form = {
      title: campaign.title,
      festivalName: campaign.festivalName,
      tabLabel: campaign.tabLabel || '',
      startDate: this.toDateTimeLocal(campaign.startDate),
      endDate: this.toDateTimeLocal(campaign.endDate),
      isActive: campaign.isActive,
      items: campaign.items.length
        ? campaign.items.map((x) => ({ ...x }))
        : [{ sector: '', title: '', route: '', imageUrl: '' }],
    };
    this.submitError = null;
    this.submitSuccess = null;
    this.showModal = true;
  }

  toggle(campaign: SeasonalCampaign): void {
    this.error = null;
    this.success = null;
    this.submitError = null;
    this.submitSuccess = null;
    this.togglingId = campaign.id;
    this.http
      .patch(buildApiUrl(`/highlights/campaigns/${campaign.id}`), {
        isActive: !campaign.isActive,
      })
      .subscribe({
        next: () => {
          campaign.isActive = !campaign.isActive;
          this.success = campaign.isActive
            ? 'Campagne activée.'
            : 'Campagne désactivée.';
          this.togglingId = null;
        },
        error: (err) => {
          this.error = this.readableError(err, 'Mise à jour impossible');
          this.togglingId = null;
        },
      });
  }

  remove(id: string): void {
    if (!confirm('Supprimer cette campagne ?')) return;
    this.http.delete(buildApiUrl(`/highlights/campaigns/${id}`)).subscribe({
      next: () => this.load(),
      error: () => (this.error = 'Suppression impossible'),
    });
  }

  save(): void {
    const isUpdate = !!this.editingId;
    const title = this.form.title.trim();
    const festivalName = this.form.festivalName.trim();
    const startDateIso = this.toIsoOrNull(this.form.startDate);
    const endDateIso = this.toIsoOrNull(this.form.endDate);
    const items = this.form.items
      .filter((item) => item.sector && item.title && item.route)
      .map((item) => ({
        ...item,
        title: item.title.trim(),
        route: this.sanitizeRoute(item.route),
        description: item.description?.trim(),
        imageUrl: item.imageUrl?.trim(),
      }));
    const invalidItems = items.filter((item) => !this.isRouteValid(item.route));

    if (!title || !festivalName || !startDateIso || !endDateIso) {
      this.error = 'Titre, fête, dates début/fin sont requis.';
      this.submitError = this.error;
      this.submitSuccess = null;
      return;
    }

    if (new Date(startDateIso).getTime() > new Date(endDateIso).getTime()) {
      this.error = 'La date de début doit être antérieure à la date de fin.';
      this.submitError = this.error;
      this.submitSuccess = null;
      return;
    }

    if (invalidItems.length > 0) {
      this.error =
        'Certaines routes d’items sont invalides. Utilisez des routes internes comme /shop, /events, /todo.';
      this.submitError = this.error;
      this.submitSuccess = null;
      return;
    }

    const payload = {
      title,
      festivalName,
      tabLabel: this.form.tabLabel.trim() || undefined,
      startDate: startDateIso,
      endDate: endDateIso,
      isActive: this.form.isActive,
      items,
    };

    this.saving = true;
    this.error = null;
    this.success = null;
    this.submitError = null;
    this.submitSuccess = null;
    const request = this.editingId
      ? this.http.patch(buildApiUrl(`/highlights/campaigns/${this.editingId}`), payload)
      : this.http.post(buildApiUrl('/highlights/campaigns'), payload);

    request
      .pipe(
        timeout(15000),
        finalize(() => {
          this.saving = false;
        }),
      )
      .subscribe({
      next: () => {
        this.close();
        this.success = isUpdate
          ? 'Campagne mise à jour avec succès.'
          : 'Campagne créée avec succès.';
        this.submitSuccess = this.success;
        this.load();
      },
      error: (err) => {
        console.error('Campaign save failed', err);
        this.error = this.readableError(err, 'Enregistrement impossible');
        this.submitError = this.error;
        this.submitSuccess = null;
      },
    });
  }

  addItem(): void {
    this.form.items = [
      ...this.form.items,
      { sector: '', title: '', route: '', imageUrl: '' },
    ];
  }

  onItemSectorChange(item: CampaignItem): void {
    const defaultRoute = this.sectorRouteDefaults[item.sector] || '';
    if (!item.route?.trim() && defaultRoute) {
      item.route = defaultRoute;
    }
  }

  routeExample(sector: string): string {
    return this.sectorRouteDefaults[sector] || '/shop';
  }

  isRouteValid(route: string): boolean {
    const normalized = this.sanitizeRoute(route);
    if (!normalized) return false;
    const root = `/${normalized.split('/').filter(Boolean)[0] || ''}`;
    return normalized === '/' || this.allowedRoutePrefixes.includes(root);
  }

  removeItem(index: number): void {
    this.form.items = this.form.items.filter((_, i) => i !== index);
    if (this.form.items.length === 0) {
      this.form.items = [{ sector: '', title: '', route: '', imageUrl: '' }];
    }
  }

  close(): void {
    this.showModal = false;
    this.editingId = null;
    this.submitError = null;
    this.submitSuccess = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.form = {
      title: '',
      festivalName: '',
      tabLabel: '',
      startDate: '',
      endDate: '',
      isActive: true,
      items: [{ sector: '', title: '', route: '', imageUrl: '' }],
    };
  }

  private toDateTimeLocal(value: string): string {
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }

  private toIsoOrNull(value: string): string | null {
    if (!value || !value.trim()) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;
    return date.toISOString();
  }

  trackByIndex(index: number): number {
    return index;
  }

  private readableError(err: HttpErrorResponse, fallback: string): string {
    const backendMessage =
      (typeof err?.error?.message === 'string' && err.error.message) ||
      (Array.isArray(err?.error?.message) && err.error.message.join(', ')) ||
      '';
    const status = err?.status ? ` [HTTP ${err.status}]` : '';
    return backendMessage
      ? `${backendMessage}${status}`
      : `${fallback}${status}`;
  }

  private sanitizeRoute(route: string): string {
    const trimmed = String(route || '').trim();
    if (!trimmed) return '';
    if (/^(https?:)?\/\//i.test(trimmed)) return '';
    if (/^javascript:/i.test(trimmed)) return '';
    return trimmed.startsWith('/') ? trimmed : `/${trimmed}`;
  }
}
