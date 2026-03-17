import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-clean-quote-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Demande de devis C'Clean</h1>
        <a [routerLink]="['/clean']">Retour</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="success">{{ success }}</p>

      <form class="card app-shell-card" (ngSubmit)="submit()">
        <div class="row">
          <div>
            <label>Nom complet *</label>
            <input [(ngModel)]="model.fullName" name="fullName" required />
          </div>
          <div>
            <label>Email *</label>
            <input type="email" [(ngModel)]="model.email" name="email" required />
          </div>
        </div>

        <div class="row">
          <div>
            <label>Téléphone</label>
            <input [(ngModel)]="model.phone" name="phone" />
          </div>
          <div>
            <label>Ville</label>
            <input [(ngModel)]="model.city" name="city" />
          </div>
        </div>

        <label>Service demandé *</label>
        <input [(ngModel)]="model.serviceTitle" name="serviceTitle" required />

        <label>Adresse *</label>
        <input [(ngModel)]="model.address" name="address" required />

        <label>Détails de la demande *</label>
        <textarea rows="4" [(ngModel)]="model.requestDetails" name="requestDetails" required></textarea>

        <label>Date souhaitée (optionnel)</label>
        <input type="datetime-local" [(ngModel)]="model.preferredDate" name="preferredDate" />

        <button type="submit" [disabled]="loading">{{ loading ? 'Envoi...' : 'Envoyer ma demande' }}</button>
      </form>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.4rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:8px 12px; background:#f4f9ff; color:#245f99; font-weight:700; }
    .card { border:1px solid var(--line); border-radius:14px; padding:14px; display:grid; gap:8px; }
    .row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    input, textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:10px; font:inherit; }
    label { font-weight:700; color:var(--ink-1); font-size:.9rem; }
    button { height:44px; border:none; border-radius:999px; background:#55a53d; color:#fff; font-weight:800; cursor:pointer; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    @media (max-width: 860px) { .row { grid-template-columns:1fr; } }
  `],
})
export class CleanQuoteRequestComponent {
  loading = false;
  error: string | null = null;
  success: string | null = null;

  model = {
    fullName: '',
    email: '',
    phone: '',
    serviceTitle: '',
    requestDetails: '',
    address: '',
    city: '',
    preferredDate: '',
  };

  constructor(private readonly api: ApiService) {}

  submit(): void {
    this.loading = true;
    this.error = null;
    this.success = null;
    const payload = {
      ...this.model,
      preferredDate: this.model.preferredDate ? new Date(this.model.preferredDate).toISOString() : undefined,
    };

    this.api.post('/cclean/quotes', payload).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Demande de devis envoyée.';
      },
      error: (err) => {
        this.loading = false;
        this.error = this.extractError(err) || 'Impossible d’envoyer la demande de devis.';
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

