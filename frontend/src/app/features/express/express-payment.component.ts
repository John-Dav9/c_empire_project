import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';

type ProviderOption = {
  label: string;
  value:
    | 'mtn_momo'
    | 'orange_money'
    | 'wave'
    | 'stripe'
    | 'paypal'
    | 'card';
};

@Component({
  selector: 'app-express-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Paiement livraison C'Express</h1>
        <a [routerLink]="['/express/my-deliveries']">Mes livraisons</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="notice">{{ notice }}</p>

      <form class="card app-shell-card" (ngSubmit)="submit()" *ngIf="deliveryId">
        <label>ID livraison</label>
        <input [value]="deliveryId" disabled />

        <label>Moyen de paiement</label>
        <select [(ngModel)]="provider" name="provider" required>
          <option *ngFor="let item of providers" [value]="item.value">{{ item.label }}</option>
        </select>

        <button type="submit" [disabled]="loading">{{ loading ? 'Initialisation...' : 'Payer maintenant' }}</button>
      </form>

      <section class="result app-shell-card" *ngIf="redirectUrl || instructions">
        <p *ngIf="redirectUrl">
          Redirection paiement:
          <a [href]="redirectUrl" target="_blank" rel="noopener">ouvrir la page de paiement</a>
        </p>
        <pre *ngIf="instructions">{{ instructions | json }}</pre>
      </section>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.35rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:9px 12px; color:#245f99; background:#f4f9ff; font-weight:800; }
    .card { border:1px solid var(--line); border-radius:14px; padding:14px; display:grid; gap:8px; max-width:560px; }
    input, select { width:100%; border:1px solid var(--line); border-radius:10px; padding:10px; font:inherit; }
    label { font-weight:700; color:var(--ink-1); font-size:.9rem; }
    button { height:44px; border:none; border-radius:999px; background:#2f6eb8; color:#fff; font-weight:800; cursor:pointer; }
    .result { border:1px solid var(--line); border-radius:12px; padding:12px; }
    .result a { color:#245f99; font-weight:800; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
  `],
})
export class ExpressPaymentComponent implements OnInit {
  deliveryId = '';
  provider: ProviderOption['value'] = 'mtn_momo';
  loading = false;
  error: string | null = null;
  notice: string | null = null;
  redirectUrl: string | null = null;
  instructions: unknown;

  providers: ProviderOption[] = [
    { label: 'MTN MoMo', value: 'mtn_momo' },
    { label: 'Orange Money', value: 'orange_money' },
    { label: 'Wave', value: 'wave' },
    { label: 'Carte', value: 'card' },
    { label: 'Stripe', value: 'stripe' },
    { label: 'PayPal', value: 'paypal' },
  ];

  constructor(
    private readonly route: ActivatedRoute,
    private readonly api: ApiService,
  ) {}

  ngOnInit(): void {
    this.deliveryId = this.route.snapshot.paramMap.get('deliveryId') || '';
  }

  submit(): void {
    if (!this.deliveryId) return;
    this.loading = true;
    this.error = null;
    this.notice = null;
    this.redirectUrl = null;
    this.instructions = null;

    this.api.post<any>('/c-express/payments/delivery', {
      deliveryId: this.deliveryId,
      provider: this.provider,
    }).subscribe({
      next: (res) => {
        this.loading = false;
        this.notice = 'Paiement initialisé.';
        this.redirectUrl = res?.payment?.redirectUrl || res?.redirectUrl || null;
        this.instructions = res?.payment?.instructions || res?.instructions || null;

        if (this.redirectUrl) {
          window.location.href = this.redirectUrl;
        }
      },
      error: (err) => {
        this.loading = false;
        this.error = this.extractError(err) || 'Impossible d’initier le paiement.';
      },
    });
  }

  private extractError(err: any): string {
    const raw = err?.error;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw?.message)) return raw.message.join(', ');
    return raw?.message || '';
  }
}

