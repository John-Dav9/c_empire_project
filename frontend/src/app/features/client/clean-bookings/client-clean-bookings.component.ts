import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

interface CleanBooking {
  id: string;
  serviceTitle: string;
  address: string;
  city?: string;
  scheduledAt: string;
  amount: number;
  currency: string;
  status: string;
  notes?: string;
  createdAt: string;
}

@Component({
  selector: 'app-client-clean-bookings',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, RouterLink, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="page page-enter">
      <header class="head">
        <div>
          <h1>Mes réservations C'Clean</h1>
          <p>{{ bookings().length }} réservation{{ bookings().length > 1 ? 's' : '' }}</p>
        </div>
        <div class="head-actions">
          <a routerLink="/clean" class="btn-new">
            <mat-icon>add</mat-icon>
            Nouvelle réservation
          </a>
          <button type="button" class="btn-refresh" (click)="load()" aria-label="Actualiser">
            <mat-icon>refresh</mat-icon>
          </button>
        </div>
      </header>

      @if (error()) { <p class="alert error" role="alert">{{ error() }}</p> }

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32" /><span>Chargement…</span></div>
      }

      @if (!loading()) {
        @if (bookings().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">cleaning_services</mat-icon>
            <h2>Aucune réservation</h2>
            <p>Vous n'avez pas encore réservé de service C'Clean.</p>
            <a routerLink="/clean" class="btn-cta">Découvrir C'Clean</a>
          </div>
        } @else {
          <div class="cards">
            @for (b of bookings(); track b.id) {
              <div class="booking-card">
                <div class="card-top">
                  <div class="service-name">{{ b.serviceTitle }}</div>
                  <span class="badge" [class]="'st-' + b.status.toLowerCase()">
                    {{ statusLabel(b.status) }}
                  </span>
                </div>
                <div class="card-info">
                  <div class="info-row">
                    <mat-icon>calendar_today</mat-icon>
                    <span>{{ b.scheduledAt | date:'dd/MM/yyyy' }}</span>
                  </div>
                  <div class="info-row">
                    <mat-icon>location_on</mat-icon>
                    <span>{{ b.address }}{{ b.city ? ', ' + b.city : '' }}</span>
                  </div>
                  <div class="info-row">
                    <mat-icon>payments</mat-icon>
                    <span class="amount">{{ b.amount | number:'1.0-0' }} {{ b.currency }}</span>
                  </div>
                </div>
                @if (b.notes) {
                  <div class="card-notes">{{ b.notes }}</div>
                }
                <div class="card-footer">
                  <span class="card-date">Créée le {{ b.createdAt | date:'dd/MM/yyyy' }}</span>
                  <span class="card-ref">#{{ b.id.substring(0, 8) }}</span>
                </div>
              </div>
            }
          </div>
        }
      }
    </section>
  `,
  styles: [`
    .page { display: grid; gap: 16px; }
    .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .head h1 { margin: 0; font-size: 1.25rem; }
    .head p  { margin: 4px 0 0; color: #60748d; font-size: .85rem; }
    .head-actions { display: flex; gap: 8px; align-items: center; }
    .btn-new {
      display: inline-flex; align-items: center; gap: 6px;
      background: #0d7f80; color: #fff; border: none; border-radius: 10px;
      padding: 8px 14px; font-weight: 700; font-size: .85rem;
      text-decoration: none; cursor: pointer;
    }
    .btn-refresh { background: none; border: 1px solid #d0dde8; border-radius: 8px; padding: 6px; cursor: pointer; display: flex; align-items: center; }
    .loading { display: flex; align-items: center; gap: 10px; color: #60748d; padding: 1rem; }
    .alert { padding: 10px 12px; border-radius: 10px; margin: 0; }
    .alert.error { background: #fff3ef; border: 1px solid #f5c5b7; color: #b92016; }
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { font-size: 4rem; width: 4rem; height: 4rem; color: #c8d8e8; }
    .empty-state h2 { font-size: 1.2rem; color: #1a2e40; margin: 1rem 0 .5rem; }
    .empty-state p { color: #60748d; margin-bottom: 1.5rem; }
    .btn-cta { display: inline-block; background: #0d7f80; color: #fff; border-radius: 10px; padding: 10px 20px; font-weight: 700; text-decoration: none; }
    .cards { display: grid; gap: 14px; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); }
    .booking-card { background: #fff; border: 1px solid #eef2f8; border-radius: 14px; padding: 16px; display: grid; gap: 12px; }
    .card-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; }
    .service-name { font-weight: 700; color: #1a2e40; font-size: 1rem; }
    .badge { border-radius: 999px; padding: 3px 10px; font-size: .75rem; font-weight: 700; border: 1px solid; white-space: nowrap; }
    .st-draft            { background: #f5f5f5; border-color: #ccc; color: #666; }
    .st-payment_pending  { background: #fff8e1; border-color: #ffe082; color: #7a5c00; }
    .st-confirmed        { background: #e8f5e9; border-color: #a5d6a7; color: #1b5e20; }
    .st-assigned         { background: #e3f2fd; border-color: #90caf9; color: #0d47a1; }
    .st-in_progress      { background: #fff3e0; border-color: #ffcc80; color: #e65100; }
    .st-done             { background: #e8f5e9; border-color: #66bb6a; color: #1b5e20; }
    .st-cancelled        { background: #f5f5f5; border-color: #bdbdbd; color: #616161; }
    .card-info { display: grid; gap: 6px; }
    .info-row { display: flex; align-items: center; gap: 8px; font-size: .875rem; color: #4a6078; }
    .info-row mat-icon { font-size: 1rem; width: 1rem; height: 1rem; color: #8a9ab0; }
    .amount { font-weight: 700; color: #1a2e40; }
    .card-notes { font-size: .8rem; color: #60748d; background: #f7fafd; border-radius: 8px; padding: 8px 10px; }
    .card-footer { display: flex; justify-content: space-between; font-size: .75rem; color: #9ab0c8; border-top: 1px solid #f0f4f8; padding-top: 8px; }
  `],
})
export class ClientCleanBookingsComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly bookings = signal<CleanBooking[]>([]);
  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<CleanBooking[]>('/cclean/bookings/me').subscribe({
      next: (data) => { this.bookings.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message ?? 'Impossible de charger vos réservations.'); this.loading.set(false); },
    });
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      DRAFT: 'Brouillon', PAYMENT_PENDING: 'Paiement en attente',
      CONFIRMED: 'Confirmée', ASSIGNED: 'Assignée',
      IN_PROGRESS: 'En cours', DONE: 'Terminée', CANCELLED: 'Annulée',
    };
    return map[s] ?? s;
  }
}
