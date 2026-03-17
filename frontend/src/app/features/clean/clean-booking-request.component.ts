import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-clean-booking-request',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Réserver un service C'Clean</h1>
        <a [routerLink]="['/clean']">Retour aux services</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="success">{{ success }}</p>

      <form class="card app-shell-card" (ngSubmit)="submit()">
        <div class="service-box">
          <p class="title">{{ model.serviceTitle || 'Service C\\'Clean' }}</p>
          <p class="amount">{{ model.amount | number:'1.0-0' }} {{ model.currency }}</p>
        </div>

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

        <label>Adresse *</label>
        <input [(ngModel)]="model.address" name="address" required />

        <label>Date/heure intervention *</label>
        <input type="datetime-local" [(ngModel)]="scheduledAtLocal" name="scheduledAtLocal" required />

        <button type="submit" [disabled]="loading">{{ loading ? 'Création...' : 'Créer ma réservation' }}</button>
      </form>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.4rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:8px 12px; background:#f4f9ff; color:#245f99; font-weight:700; }
    .card { border:1px solid var(--line); border-radius:14px; padding:14px; display:grid; gap:8px; }
    .service-box { border:1px solid #d4e7d6; border-radius:12px; padding:10px; background:#f2faf2; }
    .service-box .title { margin:0; color:#2f4d35; font-weight:800; }
    .service-box .amount { margin:2px 0 0; color:#27813c; font-weight:800; }
    .row { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:8px; }
    input { width:100%; border:1px solid var(--line); border-radius:10px; padding:10px; font:inherit; }
    label { font-weight:700; color:var(--ink-1); font-size:.9rem; }
    button { height:44px; border:none; border-radius:999px; background:#55a53d; color:#fff; font-weight:800; cursor:pointer; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    @media (max-width: 860px) { .row { grid-template-columns:1fr; } }
  `],
})
export class CleanBookingRequestComponent implements OnInit {
  loading = false;
  error: string | null = null;
  success: string | null = null;
  scheduledAtLocal = '';

  model = {
    cleanServiceId: '',
    serviceTitle: '',
    amount: 0,
    currency: 'XAF',
    fullName: '',
    email: '',
    phone: '',
    address: '',
    city: '',
  };

  constructor(
    private readonly api: ApiService,
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const serviceId = this.route.snapshot.queryParamMap.get('serviceId') || '';
    const serviceTitle = this.route.snapshot.queryParamMap.get('serviceTitle') || '';
    const amount = Number(this.route.snapshot.queryParamMap.get('amount') || 0);
    this.model.cleanServiceId = serviceId;
    this.model.serviceTitle = serviceTitle;
    this.model.amount = Number.isFinite(amount) ? amount : 0;
    const now = new Date();
    now.setHours(now.getHours() + 2);
    this.scheduledAtLocal = now.toISOString().slice(0, 16);
  }

  submit(): void {
    this.loading = true;
    this.error = null;
    this.success = null;
    const scheduledAt = this.scheduledAtLocal ? new Date(this.scheduledAtLocal).toISOString() : '';
    const payload = { ...this.model, scheduledAt };

    this.api.post<any>('/cclean/bookings', payload).subscribe({
      next: (booking) => {
        this.loading = false;
        this.success = 'Réservation créée.';
        if (this.authService.isAuthenticated()) {
          this.router.navigate(['/clean/booking', booking.id]);
          return;
        }

        this.router.navigate(['/auth/signin'], {
          queryParams: { returnUrl: `/clean/booking/${booking.id}` },
        });
      },
      error: (err) => {
        this.loading = false;
        this.error = this.extractError(err) || 'Impossible de créer la réservation.';
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
