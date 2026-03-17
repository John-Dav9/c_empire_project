import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

interface GrillProductOption {
  id: string;
  title: string;
}

interface GrillPackItem {
  productId: string;
  qty: number;
}

interface GrillPack {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  isAvailable: boolean;
  images?: string[];
  items: GrillPackItem[];
}

@Component({
  selector: 'app-grill-menus',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-enter">
      <header class="head">
        <h1>🍱 Menus C'Grill</h1>
        <button class="btn btn-primary" (click)="openCreate()">+ Créer un pack</button>
      </header>

      <p *ngIf="error" class="alert">{{ error }}</p>

      <div class="table-wrap app-shell-card">
        <table class="table">
          <thead>
            <tr>
              <th>Titre</th>
              <th>Prix</th>
              <th>Items</th>
              <th>Disponibilité</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let pack of packs">
              <td>{{ pack.title }}</td>
              <td>{{ pack.price }} {{ pack.currency || 'XAF' }}</td>
              <td>{{ pack.items.length }}</td>
              <td>
                <span class="status" [class.active]="pack.isAvailable">
                  {{ pack.isAvailable ? 'Disponible' : 'Indisponible' }}
                </span>
              </td>
              <td class="actions">
                <button class="btn btn-secondary" (click)="editPack(pack)">Modifier</button>
                <button class="btn btn-secondary" (click)="toggleAvailability(pack)">
                  {{ pack.isAvailable ? 'Désactiver' : 'Activer' }}
                </button>
                <button class="btn btn-danger" (click)="deletePack(pack.id)">Supprimer</button>
              </td>
            </tr>
            <tr *ngIf="packs.length === 0">
              <td colspan="5">Aucun pack trouvé</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div *ngIf="showModal" class="modal-overlay" (click)="closeModal()">
        <div class="modal app-shell-card" (click)="$event.stopPropagation()">
          <div class="modal-head">
            <h2>{{ editingId ? 'Modifier' : 'Créer' }} un pack</h2>
            <button class="close" (click)="closeModal()">✕</button>
          </div>

          <form (ngSubmit)="savePack()" class="form">
            <label>Titre *</label>
            <input [(ngModel)]="form.title" name="title" required />

            <label>Description</label>
            <textarea [(ngModel)]="form.description" name="description" rows="2"></textarea>

            <div class="row">
              <div>
                <label>Prix *</label>
                <input type="number" min="0" [(ngModel)]="form.price" name="price" required />
              </div>
              <div>
                <label>Devise</label>
                <input [(ngModel)]="form.currency" name="currency" />
              </div>
            </div>

            <label>Images (URLs séparées par virgules)</label>
            <textarea [(ngModel)]="form.imagesText" name="imagesText" rows="2"></textarea>

            <label class="check">
              <input type="checkbox" [(ngModel)]="form.isAvailable" name="isAvailable" />
              Disponible
            </label>

            <div class="composition">
              <div class="composition-head">
                <h3>Composition du pack *</h3>
                <button type="button" class="btn btn-secondary" (click)="addItem()">+ Item</button>
              </div>
              <div class="item-row" *ngFor="let item of form.items; let i = index">
                <select
                  [ngModel]="item.productId"
                  (ngModelChange)="onItemProductChange(i, $event)"
                  [name]="'product-' + i"
                  required
                >
                  <option value="">Produit...</option>
                  <option *ngFor="let product of products" [value]="product.id">
                    {{ product.title }}
                  </option>
                </select>
                <input
                  type="number"
                  min="1"
                  [ngModel]="item.qty"
                  (ngModelChange)="onItemQtyChange(i, $event)"
                  [name]="'qty-' + i"
                  required
                />
                <button type="button" class="btn btn-danger" (click)="removeItem(i)">Retirer</button>
              </div>
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
      .page { padding: 0 2px; max-width: 1400px; margin: 0 auto; }
      .head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 1rem; gap: .8rem; flex-wrap: wrap; }
      .head h1 { margin: 0; color: var(--ink-0); }
      .alert { padding: .8rem; border-radius: 10px; background: #fdecea; color: #9f2918; margin-bottom: .8rem; }
      .table-wrap { border: 1px solid var(--line); border-radius: 14px; overflow: hidden; }
      .table { width: 100%; border-collapse: collapse; }
      .table th, .table td { padding: .85rem; border-bottom: 1px solid var(--line); text-align: left; }
      .table thead { background: #f7f1e5; }
      .actions { display: flex; gap: .4rem; flex-wrap: wrap; }
      .status { display: inline-block; padding: .22rem .6rem; border-radius: 999px; background: #ffe4de; color: #9f2918; }
      .status.active { background: #d2f3eb; color: #0f6d5f; }
      .btn { border: none; border-radius: 10px; padding: .55rem .82rem; font-weight: 700; cursor: pointer; }
      .btn-primary { background: var(--brand); color: #fff; }
      .btn-secondary { background: #7d6f5d; color: #fff; }
      .btn-danger { background: #b92016; color: #fff; }
      .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.55); display: flex; justify-content: center; align-items: flex-start; padding: 92px 1rem 1rem; z-index: 2100; overflow-y: auto; }
      .modal { width: min(820px, 100%); border: 1px solid var(--line); border-radius: 14px; padding: 1rem; background: #fff; }
      .modal-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: .8rem; }
      .modal-head h2 { margin: 0; }
      .close { width: 34px; height: 34px; border-radius: 8px; border: 1px solid var(--line); background: #fff; cursor: pointer; }
      .form { display: grid; gap: .55rem; }
      .form input, .form select, .form textarea { width: 100%; border: 1px solid var(--line); border-radius: 10px; padding: .66rem .72rem; font-size: .95rem; }
      .row { display: grid; grid-template-columns: 1fr 1fr; gap: .55rem; }
      .check { display: inline-flex; align-items: center; gap: .45rem; color: var(--ink-1); }
      .composition { margin-top: .5rem; border: 1px solid var(--line); border-radius: 10px; padding: .7rem; }
      .composition-head { display: flex; justify-content: space-between; align-items: center; gap: .5rem; margin-bottom: .6rem; }
      .composition-head h3 { margin: 0; font-size: 1rem; }
      .item-row { display: grid; grid-template-columns: 1fr 110px auto; gap: .5rem; align-items: center; margin-bottom: .5rem; }
      .foot { margin-top: .7rem; display: flex; justify-content: flex-end; gap: .5rem; }
      @media (max-width: 760px) {
        .row { grid-template-columns: 1fr; }
        .item-row { grid-template-columns: 1fr; }
      }
    `,
  ],
})
export class GrillMenusComponent implements OnInit {
  private readonly http = inject(HttpClient);

  packs: GrillPack[] = [];
  products: GrillProductOption[] = [];
  error: string | null = null;
  saving = false;
  showModal = false;
  editingId: string | null = null;

  form = {
    title: '',
    description: '',
    price: 0,
    currency: 'XAF',
    isAvailable: true,
    imagesText: '',
    items: [{ productId: '', qty: 1 }] as GrillPackItem[],
  };

  ngOnInit(): void {
    this.loadPacks();
    this.loadProducts();
  }

  loadPacks(): void {
    this.http
      .get<GrillPack[]>(buildApiUrl('/grill/menu-packs/admin/all'))
      .subscribe({
        next: (res) => (this.packs = res ?? []),
        error: () => (this.error = 'Impossible de charger les packs grill'),
      });
  }

  loadProducts(): void {
    this.http
      .get<GrillProductOption[]>(buildApiUrl('/grill/products/admin/all'))
      .subscribe({
        next: (res) => (this.products = res ?? []),
      });
  }

  openCreate(): void {
    this.editingId = null;
    this.resetForm();
    this.showModal = true;
  }

  editPack(pack: GrillPack): void {
    this.editingId = pack.id;
    this.form = {
      title: pack.title || '',
      description: pack.description || '',
      price: Number(pack.price || 0),
      currency: pack.currency || 'XAF',
      isAvailable: Boolean(pack.isAvailable),
      imagesText: (pack.images ?? []).join(', '),
      items:
        pack.items?.map((item) => ({
          productId: item.productId,
          qty: Number(item.qty || 1),
        })) ?? [{ productId: '', qty: 1 }],
    };
    this.showModal = true;
  }

  toggleAvailability(pack: GrillPack): void {
    this.http
      .patch(buildApiUrl(`/grill/menu-packs/admin/${pack.id}`), {
        isAvailable: !pack.isAvailable,
      })
      .subscribe({
        next: () => this.loadPacks(),
        error: () => (this.error = 'Mise à jour impossible'),
      });
  }

  deletePack(id: string): void {
    if (!confirm('Supprimer ce pack ?')) return;
    this.http.delete(buildApiUrl(`/grill/menu-packs/admin/${id}`)).subscribe({
      next: () => this.loadPacks(),
      error: () => (this.error = 'Suppression impossible'),
    });
  }

  savePack(): void {
    const items = this.form.items
      .map((item) => ({ productId: item.productId, qty: Number(item.qty) }))
      .filter((item) => Boolean(item.productId) && item.qty > 0);

    if (!this.form.title.trim() || items.length === 0) {
      this.error = 'Titre et composition du pack requis.';
      return;
    }

    const images = this.form.imagesText
      .split(',')
      .map((x) => x.trim())
      .filter((x) => x.length > 0);

    const payload = {
      title: this.form.title.trim(),
      description: this.form.description.trim() || undefined,
      price: Number(this.form.price),
      currency: this.form.currency.trim() || 'XAF',
      isAvailable: this.form.isAvailable,
      images: images.length ? images : undefined,
      items,
    };

    this.saving = true;
    const request = this.editingId
      ? this.http.patch(buildApiUrl(`/grill/menu-packs/admin/${this.editingId}`), payload)
      : this.http.post(buildApiUrl('/grill/menu-packs/admin'), payload);

    request.subscribe({
      next: () => {
        this.saving = false;
        this.closeModal();
        this.loadPacks();
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Enregistrement impossible';
      },
    });
  }

  addItem(): void {
    this.form.items = [...this.form.items, { productId: '', qty: 1 }];
  }

  removeItem(index: number): void {
    this.form.items = this.form.items.filter((_, i) => i !== index);
    if (this.form.items.length === 0) {
      this.form.items = [{ productId: '', qty: 1 }];
    }
  }

  onItemProductChange(index: number, value: string): void {
    this.form.items[index] = { ...this.form.items[index], productId: value };
  }

  onItemQtyChange(index: number, value: number): void {
    const qty = Number(value || 1);
    this.form.items[index] = { ...this.form.items[index], qty: qty > 0 ? qty : 1 };
  }

  closeModal(): void {
    this.showModal = false;
    this.editingId = null;
    this.resetForm();
  }

  private resetForm(): void {
    this.form = {
      title: '',
      description: '',
      price: 0,
      currency: 'XAF',
      isAvailable: true,
      imagesText: '',
      items: [{ productId: '', qty: 1 }],
    };
  }
}

