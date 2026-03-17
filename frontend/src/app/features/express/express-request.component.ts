import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';

@Component({
  selector: 'app-express-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Nouvelle livraison C'Express</h1>
        <a [routerLink]="['/express/my-deliveries']">Mes livraisons</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="success">{{ success }}</p>

      <form class="card app-shell-card" (ngSubmit)="submit()">
        <label>Adresse pickup *</label>
        <input [(ngModel)]="model.pickupAddress" name="pickupAddress" required />

        <label>Adresse livraison *</label>
        <input [(ngModel)]="model.deliveryAddress" name="deliveryAddress" required />

        <label>Type de colis *</label>
        <input [(ngModel)]="model.packageType" name="packageType" required />

        <div class="row">
          <div>
            <label>Poids (kg)</label>
            <input type="number" min="0" [(ngModel)]="model.weightKg" name="weightKg" />
          </div>
          <div>
            <label>Distance (km)</label>
            <input type="number" min="0" [(ngModel)]="model.distanceKm" name="distanceKm" />
          </div>
          <div>
            <label>Urgence</label>
            <select [(ngModel)]="model.urgencyLevel" name="urgencyLevel">
              <option [ngValue]="1">Normal</option>
              <option [ngValue]="2">Urgent</option>
              <option [ngValue]="3">Très urgent</option>
            </select>
          </div>
        </div>

        <label>Note</label>
        <textarea rows="3" [(ngModel)]="model.customerNote" name="customerNote"></textarea>

        <button type="submit" [disabled]="loading">{{ loading ? 'Envoi...' : 'Créer la livraison' }}</button>
      </form>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.4rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:8px 12px; background:#f4f9ff; color:#245f99; font-weight:700; }
    .card { border:1px solid var(--line); border-radius:14px; padding:14px; display:grid; gap:8px; }
    .row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:8px; }
    input, select, textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:10px; font:inherit; }
    label { font-weight:700; color:var(--ink-1); font-size:.9rem; }
    button { height:44px; border:none; border-radius:999px; background:#2f6eb8; color:#fff; font-weight:800; cursor:pointer; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    @media (max-width: 860px) { .row { grid-template-columns:1fr; } }
  `],
})
export class ExpressRequestComponent {
  loading = false;
  error: string | null = null;
  success: string | null = null;

  model = {
    pickupAddress: '',
    deliveryAddress: '',
    packageType: 'parcel',
    weightKg: 1,
    distanceKm: 5,
    urgencyLevel: 1,
    customerNote: '',
  };

  constructor(private readonly api: ApiService, private readonly router: Router) {}

  submit(): void {
    this.loading = true;
    this.error = null;
    this.success = null;

    this.api.post<any>('/c-express/delivery', this.model).subscribe({
      next: (delivery) => {
        this.loading = false;
        this.success = `Livraison créée (${delivery.id}).`;
        this.router.navigate(['/express/payment', delivery.id]);
      },
      error: (err) => {
        this.loading = false;
        this.error = this.extractError(err) || 'Impossible de créer la livraison.';
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
