import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

type PromotionType = 'percent' | 'fixed';

interface PromotionItem {
  id: string;
  title: string;
  code?: string;
  description?: string;
  type: PromotionType;
  value: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
  products?: Array<{ id: string; name: string }>;
}

interface ProductOption {
  id: string;
  name: string;
}

@Component({
  selector: 'app-shop-promotions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="promo-page page-enter">
      <header class="head">
        <h1>🏷️ Promotions & Codes C'Shop</h1>
        <button class="btn btn-primary" (click)="openCreate()">+ Nouvelle promo</button>
      </header>

      <div *ngIf="error" class="alert">{{ error }}</div>

      <div class="grid">
        <article class="card app-shell-card" *ngFor="let promo of promotions">
          <div class="card-top">
            <h3>{{ promo.title }}</h3>
            <span class="status" [class.active]="promo.isActive">
              {{ promo.isActive ? 'Active' : 'Inactive' }}
            </span>
          </div>
          <p class="code" *ngIf="promo.code">Code: <strong>{{ promo.code }}</strong></p>
          <p class="meta">
            {{ promo.type === 'percent' ? '-' + promo.value + '%' : '-' + promo.value + ' XAF' }}
          </p>
          <p class="meta">{{ promo.products?.length || 0 }} produit(s) ciblé(s)</p>
          <div class="actions">
            <button class="btn btn-secondary" (click)="editPromo(promo)">Modifier</button>
            <button class="btn btn-secondary" (click)="toggleActive(promo)">
              {{ promo.isActive ? 'Désactiver' : 'Activer' }}
            </button>
            <button class="btn btn-danger" (click)="deletePromo(promo.id)">Supprimer</button>
          </div>
        </article>
      </div>

      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal app-shell-card" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId ? 'Modifier' : 'Créer' }} une promotion</h2>
            <button class="close" (click)="closeModal()">✕</button>
          </div>

          <form (ngSubmit)="savePromo()" class="form">
            <label>Titre *</label>
            <input [(ngModel)]="form.title" name="title" required />

            <label>Code promo (optionnel)</label>
            <input [(ngModel)]="form.code" name="code" placeholder="EX: WELCOME10" />

            <label>Description</label>
            <textarea [(ngModel)]="form.description" name="description" rows="2"></textarea>

            <div class="row">
              <div>
                <label>Type *</label>
                <select [(ngModel)]="form.type" name="type" required>
                  <option value="percent">Pourcentage</option>
                  <option value="fixed">Montant fixe</option>
                </select>
              </div>
              <div>
                <label>Valeur *</label>
                <input type="number" [(ngModel)]="form.value" name="value" min="0.01" required />
              </div>
            </div>

            <div class="row">
              <div>
                <label>Début</label>
                <input type="datetime-local" [(ngModel)]="form.startsAt" name="startsAt" />
              </div>
              <div>
                <label>Fin</label>
                <input type="datetime-local" [(ngModel)]="form.endsAt" name="endsAt" />
              </div>
            </div>

            <label class="check">
              <input type="checkbox" [(ngModel)]="form.isActive" name="isActive" />
              Active
            </label>

            <label>Produits concernés *</label>
            <div class="product-list">
              <label *ngFor="let p of products" class="check">
                <input
                  type="checkbox"
                  [checked]="form.productIds.includes(p.id)"
                  (change)="toggleProduct(p.id, $event)"
                />
                {{ p.name }}
              </label>
            </div>

            <div class="foot">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </section>
  `,
  styles: [
    `
      .promo-page { padding: 0 2px; max-width: 1400px; margin: 0 auto; }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: .8rem; flex-wrap: wrap; }
      .head h1 { margin: 0; color: var(--ink-0); }
      .alert { padding: .8rem; border-radius: 10px; background: #fdecea; color: #9f2918; margin-bottom: .8rem; }
      .grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: .8rem; }
      .card { padding: 1rem; border: 1px solid var(--line); border-radius: 14px; }
      .card-top { display: flex; justify-content: space-between; align-items: center; gap: .6rem; }
      .card-top h3 { margin: 0; }
      .status { font-size: .78rem; padding: .22rem .6rem; border-radius: 999px; background: #eee; }
      .status.active { background: #d2f3eb; color: #0f6d5f; }
      .code, .meta { margin: .4rem 0; color: var(--ink-1); }
      .actions { display: flex; gap: .4rem; flex-wrap: wrap; margin-top: .7rem; }
      .btn { border: none; border-radius: 10px; padding: .55rem .85rem; font-weight: 700; cursor: pointer; }
      .btn-primary { background: var(--brand); color: #fff; }
      .btn-secondary { background: #7d6f5d; color: #fff; }
      .btn-danger { background: #b92016; color: #fff; }
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.5); display: flex; justify-content: center; align-items: flex-start; padding: 92px 1rem 1rem; z-index: 2100; overflow-y: auto; }
      .modal { width: min(760px, 100%); border: 1px solid var(--line); border-radius: 14px; padding: 1rem; background: #fff; }
      .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .8rem; }
      .modal-head h2 { margin: 0; }
      .close { border: 1px solid var(--line); background: #fff; border-radius: 8px; width: 34px; height: 34px; cursor: pointer; }
      .form { display: grid; gap: .55rem; }
      .form input, .form select, .form textarea { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: .66rem .72rem; font-size: .95rem; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }
      .check { display: inline-flex; align-items: center; gap: .45rem; color: var(--ink-1); }
      .product-list { border: 1px solid var(--line); border-radius: 10px; max-height: 190px; overflow-y: auto; padding: .6rem; display: grid; gap: .4rem; }
      .foot { margin-top: .7rem; display: flex; justify-content: flex-end; gap: .5rem; }
      @media (max-width: 720px) { .row { grid-template-columns: 1fr; } }
    `,
  ],
})
export class ShopPromotionsComponent implements OnInit {
  private readonly http = inject(HttpClient);

  promotions: PromotionItem[] = [];
  products: ProductOption[] = [];
  error: string | null = null;
  saving = false;
  showModal = false;
  editingId: string | null = null;

  form = {
    title: '',
    code: '',
    description: '',
    type: 'percent' as PromotionType,
    value: 10,
    startsAt: '',
    endsAt: '',
    isActive: true,
    productIds: [] as string[],
  };

  ngOnInit(): void {
    this.loadPromotions();
    this.loadProducts();
  }

  loadPromotions(): void {
    this.http.get<PromotionItem[]>(buildApiUrl('/cshop/promotions')).subscribe({
      next: (res) => (this.promotions = res ?? []),
      error: () => (this.error = 'Impossible de charger les promotions'),
    });
  }

  loadProducts(): void {
    this.http
      .get<{ data: Array<{ id: string; name: string }> }>(
        buildApiUrl('/cshop/products?page=1&limit=200'),
      )
      .subscribe({
        next: (res) => (this.products = res?.data ?? []),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.resetForm();
    this.showModal = true;
  }

  editPromo(promo: PromotionItem): void {
    this.editingId = promo.id;
    this.form = {
      title: promo.title || '',
      code: promo.code || '',
      description: promo.description || '',
      type: promo.type,
      value: Number(promo.value || 0),
      startsAt: this.toDateTimeLocal(promo.startsAt),
      endsAt: this.toDateTimeLocal(promo.endsAt),
      isActive: Boolean(promo.isActive),
      productIds: (promo.products ?? []).map((p) => p.id),
    };
    this.showModal = true;
  }

  deletePromo(id: string): void {
    if (!confirm('Supprimer cette promotion ?')) return;
    this.http.delete(buildApiUrl(`/cshop/promotions/${id}`)).subscribe({
      next: () => this.loadPromotions(),
      error: () => (this.error = 'Suppression impossible'),
    });
  }

  toggleActive(promo: PromotionItem): void {
    this.http
      .patch(
        buildApiUrl(`/cshop/promotions/${promo.id}/active/${!promo.isActive}`),
        {},
      )
      .subscribe({
        next: () => this.loadPromotions(),
        error: () => (this.error = 'Mise à jour impossible'),
      });
  }

  savePromo(): void {
    if (!this.form.title.trim() || this.form.productIds.length === 0) {
      this.error = 'Titre et au moins un produit sont requis.';
      return;
    }

    this.saving = true;
    this.error = null;
    const payload = {
      title: this.form.title.trim(),
      code: this.form.code.trim() || undefined,
      description: this.form.description.trim() || undefined,
      type: this.form.type,
      value: Number(this.form.value),
      isActive: this.form.isActive,
      startsAt: this.form.startsAt ? new Date(this.form.startsAt) : undefined,
      endsAt: this.form.endsAt ? new Date(this.form.endsAt) : undefined,
      productIds: this.form.productIds,
    };

    const request = this.editingId
      ? this.http.patch(buildApiUrl(`/cshop/promotions/${this.editingId}`), payload)
      : this.http.post(buildApiUrl('/cshop/promotions'), payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadPromotions();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Enregistrement impossible';
      },
    });
  }

  toggleProduct(productId: string, event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    if (checked) {
      if (!this.form.productIds.includes(productId)) {
        this.form.productIds = [...this.form.productIds, productId];
      }
      return;
    }
    this.form.productIds = this.form.productIds.filter((id) => id !== productId);
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.form = {
      title: '',
      code: '',
      description: '',
      type: 'percent',
      value: 10,
      startsAt: '',
      endsAt: '',
      isActive: true,
      productIds: [],
    };
  }

  private toDateTimeLocal(value?: string): string {
    if (!value) return '';
    const d = new Date(value);
    if (Number.isNaN(d.getTime())) return '';
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  }
}

