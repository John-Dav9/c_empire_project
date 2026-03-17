import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

type BookingStatus = 'PENDING' | 'VALIDATED' | 'REFUSED' | 'PAID' | 'CANCELLED';

type EventBookingRow = {
  id: string;
  eventDate: string;
  location: string;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  event?: {
    title?: string;
    category?: string;
  };
  user?: {
    email?: string;
    firstname?: string;
    lastname?: string;
  };
};

@Component({
  selector: 'app-events-bookings-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Réservations C'Events</h1>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="notice">{{ notice }}</p>

      <section class="table-wrap app-shell-card">
        <table>
          <thead>
            <tr>
              <th>Event</th>
              <th>Client</th>
              <th>Date event</th>
              <th>Lieu</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let row of rows">
              <td>
                <div class="event-title">{{ row.event?.title || '-' }}</div>
                <div class="muted">{{ row.event?.category || '-' }}</div>
              </td>
              <td>
                <div>{{ fullName(row) }}</div>
                <div class="muted">{{ row.user?.email || '-' }}</div>
              </td>
              <td>{{ row.eventDate | date:'dd/MM/yyyy' }}</td>
              <td>{{ row.location }}</td>
              <td>{{ row.totalAmount | number:'1.0-0' }} FCFA</td>
              <td><span class="badge" [class]="'st-' + row.status.toLowerCase()">{{ row.status }}</span></td>
              <td class="actions">
                <button type="button" (click)="validate(row)" [disabled]="row.status !== 'PENDING'">Valider</button>
                <button type="button" class="danger" (click)="refuse(row)" [disabled]="row.status !== 'PENDING'">Refuser</button>
              </td>
            </tr>
          </tbody>
        </table>
      </section>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head, .table-wrap { border:1px solid var(--line); border-radius:12px; padding:12px; }
    .head h1 { margin:0; font-size:1.3rem; }
    table { width:100%; border-collapse:collapse; min-width:980px; }
    th, td { text-align:left; padding:10px; border-bottom:1px solid #e1ebf4; color:var(--ink-1); vertical-align:middle; }
    th { color:var(--ink-0); font-size:.86rem; text-transform:uppercase; letter-spacing:.04em; }
    .muted { color:var(--ink-2); font-size:.82rem; }
    .event-title { font-weight:700; color:var(--ink-0); }
    .badge { border-radius:999px; padding:4px 8px; border:1px solid #d4e1ef; background:#f6f9fd; font-weight:700; font-size:.78rem; }
    .st-pending { color:#8a5a00; background:#fff4dd; border-color:#edca7a; }
    .st-validated { color:#11683a; background:#e8f7ef; border-color:#9dd8b4; }
    .st-refused { color:#a53027; background:#ffeceb; border-color:#f0b5b1; }
    .st-paid { color:#1d5c91; background:#e8f5ff; border-color:#b8d9f3; }
    .st-cancelled { color:#5d6677; background:#f2f4f8; border-color:#d2d8e2; }
    .actions { display:flex; gap:6px; }
    button { height:34px; border:none; border-radius:8px; background:#2f6eb8; color:#fff; font-weight:700; padding:0 10px; cursor:pointer; }
    button:disabled { opacity:.5; cursor:not-allowed; }
    button.danger { background:#d64b3f; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
  `],
})
export class EventsBookingsManagementComponent implements OnInit {
  rows: EventBookingRow[] = [];
  error: string | null = null;
  notice: string | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.error = null;
    this.api.get<EventBookingRow[]>('/c-event/bookings').subscribe({
      next: (rows) => (this.rows = Array.isArray(rows) ? rows : []),
      error: (err) => {
        this.error = this.extractError(err) || "Impossible de charger les réservations C'Events.";
      },
    });
  }

  validate(row: EventBookingRow): void {
    this.error = null;
    this.notice = null;
    this.api.patch(`/c-event/bookings/${row.id}/validate`, {}).subscribe({
      next: () => {
        this.notice = 'Réservation validée.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Validation impossible.';
      },
    });
  }

  refuse(row: EventBookingRow): void {
    this.error = null;
    this.notice = null;
    this.api.patch(`/c-event/bookings/${row.id}/refuse`, {}).subscribe({
      next: () => {
        this.notice = 'Réservation refusée.';
        this.load();
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Refus impossible.';
      },
    });
  }

  fullName(row: EventBookingRow): string {
    const first = row.user?.firstname || '';
    const last = row.user?.lastname || '';
    const name = `${first} ${last}`.trim();
    return name || 'Client';
  }

  private extractError(err: any): string {
    const raw = err?.error;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw?.message)) return raw.message.join(', ');
    return raw?.message || '';
  }
}

