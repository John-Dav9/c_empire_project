import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../../core/services/api.service';
import { buildMediaUrl } from '../../../core/config/api.config';

type BookingStatus = 'PENDING' | 'VALIDATED' | 'REFUSED' | 'PAID' | 'CANCELLED';

type EventBooking = {
  id: string;
  eventDate: string;
  location: string;
  options?: Record<string, unknown>;
  totalAmount: number;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  event: {
    id: string;
    title: string;
    category: string;
    basePrice: number;
    images?: string[];
  };
  payment?: {
    id: string;
    provider?: string;
    status?: string;
    reference?: string;
  };
};

@Component({
  selector: 'app-client-events-bookings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <section class="bookings-page page-enter">
      <header class="head app-shell-card">
        <div>
          <h1>Mes reservations C'Events</h1>
          <p>Suivez vos demandes, leur validation et leur etat de paiement.</p>
        </div>
        <a [routerLink]="['/events']">Nouvelle reservation</a>
      </header>

      <div class="state error" *ngIf="error">{{ error }}</div>
      <div class="state info" *ngIf="notice">{{ notice }}</div>
      <div class="loading" *ngIf="loading">Chargement de vos reservations...</div>

      <section class="empty app-shell-card" *ngIf="!loading && bookings.length === 0">
        <mat-icon>event_busy</mat-icon>
        <h2>Aucune reservation pour le moment</h2>
        <p>Demarrez une nouvelle demande C'Events pour suivre ici son avancement.</p>
        <a [routerLink]="['/events']">Explorer les offres events</a>
      </section>

      <section class="list" *ngIf="!loading && bookings.length > 0">
        <article class="card app-shell-card" *ngFor="let booking of bookings">
          <div class="card-top">
            <div>
              <h2>{{ booking.event.title }}</h2>
              <p>{{ categoryLabels[booking.event.category] || booking.event.category }}</p>
            </div>
            <span class="badge" [class]="statusClass(booking.status)">
              {{ statusLabel(booking.status) }}
            </span>
          </div>

          <div class="card-grid">
            <div class="visual">
              <img
                *ngIf="booking.event.images?.[0]; else fallback"
                [src]="booking.event.images?.[0]"
                [alt]="booking.event.title"
              />
              <ng-template #fallback>
                <div class="fallback">
                  <mat-icon>event</mat-icon>
                  <span>Visuel indisponible</span>
                </div>
              </ng-template>
            </div>

            <div class="details">
              <div class="row"><span>Date evenement</span><strong>{{ booking.eventDate | date:'dd/MM/yyyy' }}</strong></div>
              <div class="row"><span>Lieu</span><strong>{{ booking.location }}</strong></div>
              <div class="row"><span>Montant</span><strong>{{ booking.totalAmount | currency:'XOF' }}</strong></div>
              <div class="row"><span>Paiement</span><strong>{{ booking.payment?.provider || '-' }}</strong></div>
              <div class="row" *ngIf="booking.payment?.reference"><span>Reference</span><strong>{{ booking.payment?.reference }}</strong></div>
              <div class="row" *ngIf="booking.options?.['notes']"><span>Notes</span><strong>{{ booking.options?.['notes'] }}</strong></div>
            </div>

            <div class="timeline">
              <h3>Progression</h3>
              <ul>
                <li [class.on]="isStepOn(booking.status, 'PENDING')">Demande soumise</li>
                <li [class.on]="isStepOn(booking.status, 'VALIDATED')">Validation admin</li>
                <li [class.on]="isStepOn(booking.status, 'PAID')">Paiement confirme</li>
              </ul>
            </div>
          </div>

          <div class="actions" *ngIf="booking.status === 'PENDING'">
            <button type="button" class="ghost" (click)="openEdit(booking)">Modifier</button>
            <button type="button" class="danger" (click)="cancelBooking(booking)">Annuler</button>
          </div>
        </article>
      </section>

      <section class="edit-panel app-shell-card" *ngIf="editingBooking">
        <div class="panel-head">
          <h2>Modifier la reservation</h2>
          <button type="button" class="close" (click)="closeEdit()">×</button>
        </div>
        <p class="panel-subtitle">{{ editingBooking.event.title }}</p>

        <form (ngSubmit)="saveEdit()" class="edit-form">
          <label>
            Date evenement
            <input type="date" [min]="today" [(ngModel)]="editDate" name="editDate" required />
          </label>

          <label>
            Lieu
            <input type="text" [(ngModel)]="editLocation" name="editLocation" required />
          </label>

          <label>
            Notes
            <textarea rows="4" [(ngModel)]="editNotes" name="editNotes"></textarea>
          </label>

          <div class="edit-actions">
            <button type="button" class="ghost" (click)="closeEdit()">Fermer</button>
            <button type="submit" class="primary" [disabled]="savingEdit">
              {{ savingEdit ? 'Enregistrement...' : 'Sauvegarder' }}
            </button>
          </div>
        </form>
      </section>
    </section>
  `,
  styles: [`
    .bookings-page { display:grid; gap:14px; }
    .head {
      border:1px solid var(--line);
      border-radius:18px;
      padding:16px;
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
      flex-wrap:wrap;
    }
    .head h1 { margin:0; font-size:clamp(1.4rem,2.3vw,2rem); }
    .head p { margin:6px 0 0; color:#60748d; }
    .head a {
      text-decoration:none;
      border-radius:999px;
      padding:10px 14px;
      border:1px solid #2f7bc2;
      background:linear-gradient(135deg,#2f7bc2,#235d96);
      color:#fff;
      font-weight:800;
      white-space:nowrap;
    }

    .state { border-radius:10px; padding:10px 12px; font-weight:700; }
    .state.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .state.info { background:#eefbf7; border:1px solid #b9eadf; color:#0b6557; }
    .loading { color:#60748d; font-weight:700; }

    .empty {
      border:1px solid var(--line);
      border-radius:16px;
      padding:24px;
      display:grid;
      place-items:center;
      text-align:center;
      gap:6px;
    }
    .empty mat-icon { width:24px; height:24px; font-size:24px; color:#6b7f98; }
    .empty h2 { margin:0; }
    .empty p { margin:0; color:#60748d; }
    .empty a {
      margin-top:6px;
      text-decoration:none;
      border-radius:999px;
      padding:9px 13px;
      background:#eef6ff;
      border:1px solid #d4e4f4;
      color:#2c5f95;
      font-weight:700;
    }

    .list { display:grid; gap:10px; }
    .card {
      border:1px solid var(--line);
      border-radius:16px;
      padding:12px;
      display:grid;
      gap:10px;
      background:#fff;
    }
    .card-top { display:flex; justify-content:space-between; align-items:flex-start; gap:10px; }
    .card-top h2 { margin:0; font-size:1.2rem; color:#2f4258; }
    .card-top p { margin:2px 0 0; color:#60748d; }
    .badge {
      border-radius:999px;
      padding:6px 10px;
      font-size:.78rem;
      font-weight:800;
      border:1px solid;
      white-space:nowrap;
    }
    .st-pending { background:#fff4dd; border-color:#edca7a; color:#8a5a00; }
    .st-validated { background:#e8f7ef; border-color:#9dd8b4; color:#11683a; }
    .st-paid { background:#e8f5ff; border-color:#b8d9f3; color:#1d5c91; }
    .st-refused { background:#ffeceb; border-color:#f0b5b1; color:#a53027; }
    .st-cancelled { background:#f2f4f8; border-color:#d2d8e2; color:#5d6677; }

    .card-grid { display:grid; grid-template-columns:220px 1fr 280px; gap:10px; }
    .visual img {
      width:100%;
      height:170px;
      border-radius:12px;
      object-fit:cover;
      border:1px solid #dce7f2;
    }
    .fallback {
      height:170px;
      border-radius:12px;
      border:1px solid #dce7f2;
      background:#f1f5fb;
      color:#7e91a7;
      display:grid;
      place-items:center;
      gap:6px;
      align-content:center;
      font-weight:700;
    }
    .details { display:grid; gap:7px; align-content:start; }
    .row {
      border:1px solid #dce7f2;
      border-radius:10px;
      padding:8px 10px;
      display:flex;
      justify-content:space-between;
      align-items:flex-start;
      gap:10px;
    }
    .row span { color:#60748d; }
    .row strong { color:#314a66; text-align:right; }

    .timeline {
      border:1px solid #dce7f2;
      border-radius:12px;
      padding:10px;
      background:#f8fbff;
      align-self:start;
    }
    .timeline h3 { margin:0 0 8px; font-size:.96rem; color:#2e4762; }
    .timeline ul { margin:0; padding:0; list-style:none; display:grid; gap:7px; }
    .timeline li {
      position:relative;
      padding-left:22px;
      color:#7388a1;
      font-weight:600;
    }
    .timeline li::before {
      content:'';
      width:12px;
      height:12px;
      border-radius:50%;
      border:2px solid #c7d6e8;
      position:absolute;
      left:0;
      top:3px;
      background:#fff;
    }
    .timeline li.on { color:#1c6299; }
    .timeline li.on::before { border-color:#2f7bc2; background:#2f7bc2; }

    .actions { display:flex; justify-content:flex-end; gap:8px; }
    .actions button {
      border-radius:10px;
      padding:8px 12px;
      font-weight:800;
      cursor:pointer;
    }
    .ghost { border:1px solid #d6e4f3; background:#fff; color:#3f546e; }
    .danger { border:1px solid #df756c; background:#ffeceb; color:#a53027; }
    .primary {
      border:1px solid #2f7bc2;
      background:linear-gradient(135deg,#2f7bc2,#235d96);
      color:#fff;
    }

    .edit-panel {
      border:1px solid var(--line);
      border-radius:16px;
      padding:14px;
      display:grid;
      gap:10px;
    }
    .panel-head { display:flex; justify-content:space-between; align-items:center; }
    .panel-head h2 { margin:0; font-size:1.2rem; color:#2f4258; }
    .close {
      border:1px solid #d6e4f3;
      border-radius:10px;
      width:34px;
      height:34px;
      background:#fff;
      color:#4a6078;
      cursor:pointer;
      font-size:1.25rem;
      line-height:1;
    }
    .panel-subtitle { margin:0; color:#60748d; font-weight:700; }
    .edit-form { display:grid; gap:10px; }
    .edit-form label { display:grid; gap:6px; color:#3f546e; font-weight:700; }
    .edit-form input, .edit-form textarea {
      border:1px solid #d6e4f3;
      border-radius:10px;
      background:#fff;
      color:#2d4157;
      font:inherit;
      padding:10px 12px;
    }
    .edit-form input { height:42px; padding-top:0; padding-bottom:0; }
    .edit-actions { display:flex; justify-content:flex-end; gap:8px; }
    .edit-actions button {
      border-radius:10px;
      padding:10px 13px;
      font-weight:800;
      cursor:pointer;
    }

    @media (max-width: 1100px) {
      .card-grid { grid-template-columns:1fr; }
    }
    @media (max-width: 760px) {
      .head, .card, .edit-panel { padding:10px; }
      .actions, .edit-actions { justify-content:flex-start; }
    }
  `],
})
export class ClientEventsBookingsComponent implements OnInit {
  readonly categoryLabels: Record<string, string> = {
    MARIAGE: 'Mariage',
    BAPTEME: 'Bapteme',
    ANNIVERSAIRE: 'Anniversaire',
    DEUIL: 'Deuil',
    SOUTENANCE: 'Soutenance',
    CONFERENCE: 'Conference',
    SEMINAIRE: 'Seminaire',
    SURPRISE: 'Surprise',
  };

  bookings: EventBooking[] = [];
  loading = true;
  error: string | null = null;
  notice: string | null = null;

  editingBooking: EventBooking | null = null;
  editDate = '';
  editLocation = '';
  editNotes = '';
  savingEdit = false;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.loadBookings();
  }

  get today(): string {
    return new Date().toISOString().slice(0, 10);
  }

  loadBookings(): void {
    this.loading = true;
    this.error = null;
    this.api.get<EventBooking[]>('/c-event/bookings/me').subscribe({
      next: (data) => {
        this.bookings = (Array.isArray(data) ? data : []).map((booking) => ({
          ...booking,
          event: {
            ...booking.event,
            images: (booking.event?.images || []).map((src) => buildMediaUrl(src)),
          },
        }));
        this.loading = false;
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Impossible de charger vos reservations.';
      },
    });
  }

  statusLabel(status: BookingStatus): string {
    const map: Record<BookingStatus, string> = {
      PENDING: 'En attente',
      VALIDATED: 'Validee',
      REFUSED: 'Refusee',
      PAID: 'Payee',
      CANCELLED: 'Annulee',
    };
    return map[status];
  }

  statusClass(status: BookingStatus): string {
    switch (status) {
      case 'PENDING':
        return 'st-pending';
      case 'VALIDATED':
        return 'st-validated';
      case 'PAID':
        return 'st-paid';
      case 'REFUSED':
        return 'st-refused';
      case 'CANCELLED':
      default:
        return 'st-cancelled';
    }
  }

  isStepOn(status: BookingStatus, step: 'PENDING' | 'VALIDATED' | 'PAID'): boolean {
    if (status === 'REFUSED' || status === 'CANCELLED') {
      return step === 'PENDING';
    }
    if (status === 'PENDING') return step === 'PENDING';
    if (status === 'VALIDATED') return step === 'PENDING' || step === 'VALIDATED';
    if (status === 'PAID') return true;
    return false;
  }

  openEdit(booking: EventBooking): void {
    this.editingBooking = booking;
    this.editDate = booking.eventDate ? String(booking.eventDate).slice(0, 10) : '';
    this.editLocation = booking.location || '';
    this.editNotes = String(booking.options?.['notes'] || '');
    this.notice = null;
    this.error = null;
  }

  closeEdit(): void {
    this.editingBooking = null;
    this.savingEdit = false;
  }

  saveEdit(): void {
    if (!this.editingBooking) return;
    if (!this.editDate || !this.editLocation.trim()) return;

    this.savingEdit = true;
    this.api
      .patch<EventBooking>(`/c-event/bookings/${this.editingBooking.id}`, {
        eventDate: this.editDate,
        location: this.editLocation.trim(),
        options: this.editNotes.trim() ? { notes: this.editNotes.trim() } : {},
      })
      .subscribe({
        next: () => {
          this.savingEdit = false;
          this.notice = 'Reservation mise a jour.';
          this.closeEdit();
          this.loadBookings();
        },
        error: (err) => {
          this.savingEdit = false;
          this.error = err?.error?.message || 'Impossible de mettre a jour la reservation.';
        },
      });
  }

  cancelBooking(booking: EventBooking): void {
    this.error = null;
    this.notice = null;
    this.api.delete(`/c-event/bookings/${booking.id}`).subscribe({
      next: () => {
        this.notice = 'Reservation annulee.';
        this.loadBookings();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible d’annuler cette reservation.';
      },
    });
  }
}
