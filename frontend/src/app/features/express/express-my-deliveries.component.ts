import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

type Delivery = {
  id: string;
  pickupAddress: string;
  deliveryAddress: string;
  packageType: string;
  price: number;
  status: string;
  paid: boolean;
  createdAt?: string;
};

@Component({
  selector: 'app-express-my-deliveries',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Mes livraisons C'Express</h1>
        <a [routerLink]="['/express/request']">+ Nouvelle livraison</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="notice">{{ notice }}</p>

      <div class="loading" *ngIf="loading">Chargement des livraisons...</div>

      <section class="grid" *ngIf="!loading">
        <article class="card app-shell-card" *ngFor="let d of deliveries">
          <div class="top">
            <h3>{{ d.pickupAddress }} -> {{ d.deliveryAddress }}</h3>
            <span class="status">{{ d.status }}</span>
          </div>
          <p>Type: {{ d.packageType }}</p>
          <p>Prix: <strong>{{ d.price | number:'1.0-0' }} F CFA</strong></p>
          <p>Paiement: <strong [class.paid]="d.paid">{{ d.paid ? 'paye' : 'en attente' }}</strong></p>
          <p class="date" *ngIf="d.createdAt">{{ d.createdAt | date:'dd/MM/yyyy HH:mm' }}</p>

          <div class="actions">
            <a class="btn" [routerLink]="['/express/payment', d.id]" *ngIf="!d.paid">Payer</a>
            <button type="button" class="btn ghost" (click)="cancel(d.id)" *ngIf="canCancel(d.status)">Annuler</button>
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.35rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:9px 12px; color:#245f99; background:#f4f9ff; font-weight:800; }
    .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(300px,1fr)); gap:10px; }
    .card { border:1px solid var(--line); border-radius:12px; padding:12px; display:grid; gap:6px; }
    .top { display:flex; justify-content:space-between; align-items:flex-start; gap:8px; }
    .top h3 { margin:0; font-size:1rem; color:var(--ink-0); }
    .status { border:1px solid #d3e0ed; background:#f6f9fd; border-radius:999px; padding:4px 8px; font-size:.78rem; font-weight:700; text-transform:uppercase; color:#48617d; }
    .card p { margin:0; color:var(--ink-1); }
    .paid { color:#13805f; }
    .date { font-size:.82rem; color:var(--ink-2); }
    .actions { display:flex; gap:8px; margin-top:4px; }
    .btn { text-decoration:none; border:none; border-radius:999px; padding:9px 12px; background:#2f6eb8; color:#fff; font-weight:800; cursor:pointer; }
    .btn.ghost { background:#fff; border:1px solid #cfdeec; color:#3b5674; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    .loading { color:var(--ink-2); font-weight:700; }
  `],
})
export class ExpressMyDeliveriesComponent implements OnInit {
  deliveries: Delivery[] = [];
  loading = true;
  error: string | null = null;
  notice: string | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.error = null;
    this.api.get<Delivery[]>('/c-express/delivery/my').subscribe({
      next: (rows) => {
        this.deliveries = Array.isArray(rows) ? rows : [];
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = this.extractError(err) || 'Impossible de charger vos livraisons.';
      },
    });
  }

  cancel(id: string): void {
    this.notice = null;
    this.error = null;
    this.api.patch(`/c-express/delivery/${id}/cancel`, {}).subscribe({
      next: () => {
        this.notice = 'Livraison annulée.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Annulation impossible.';
      },
    });
  }

  canCancel(status: string): boolean {
    const s = String(status || '').toLowerCase();
    return s !== 'canceled' && s !== 'delivered' && s !== 'in_transit';
  }

  private extractError(err: any): string {
    const raw = err?.error;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw?.message)) return raw.message.join(', ');
    return raw?.message || '';
  }
}

