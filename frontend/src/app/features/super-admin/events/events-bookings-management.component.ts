import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

interface Employee { id: string; firstname: string; lastname: string; specialty?: string; }

interface EventBookingRow {
  id: string;
  eventDate: string;
  location: string;
  totalAmount: number;
  status: string;
  assignedEmployeeId?: string | null;
  createdAt: string;
  event?: { title?: string; category?: string; };
  user?: { email?: string; firstname?: string; lastname?: string; };
}

@Component({
  selector: 'app-events-bookings-management',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <div>
          <h1>Réservations C'Events</h1>
          <p>{{ rows().length }} réservation{{ rows().length > 1 ? 's' : '' }}</p>
        </div>
        <button type="button" class="btn-refresh" (click)="load()" aria-label="Actualiser">
          <mat-icon>refresh</mat-icon>
        </button>
      </header>

      @if (error())  { <p class="alert error">{{ error() }}</p> }
      @if (notice()) { <p class="alert ok">{{ notice() }}</p> }

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32" /><span>Chargement…</span></div>
      }

      @if (!loading()) {
        <div class="table-wrap app-shell-card">
          <table>
            <thead>
              <tr>
                <th>Événement</th>
                <th>Client</th>
                <th>Date event</th>
                <th>Lieu</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Assigné</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (row of rows(); track row.id) {
                <tr>
                  <td>
                    <div class="strong">{{ row.event?.title || '—' }}</div>
                    <div class="muted">{{ categoryLabel(row.event?.category) }}</div>
                  </td>
                  <td>
                    <div class="strong">{{ fullName(row) }}</div>
                    <div class="muted">{{ row.user?.email || '—' }}</div>
                  </td>
                  <td>{{ row.eventDate | date:'dd/MM/yyyy' }}</td>
                  <td>{{ row.location }}</td>
                  <td class="strong">{{ row.totalAmount | number:'1.0-0' }} FCFA</td>
                  <td>
                    <span class="badge" [class]="'st-' + row.status.toLowerCase()">{{ statusLabel(row.status) }}</span>
                  </td>
                  <td>
                    @if (row.assignedEmployeeId) {
                      <span class="assignee-chip">{{ employeeName(row.assignedEmployeeId) }}</span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td class="actions">
                    <button
                      type="button"
                      [disabled]="row.status !== 'PENDING'"
                      (click)="validate(row)"
                    >Valider</button>
                    <button
                      type="button"
                      class="danger"
                      [disabled]="row.status !== 'PENDING'"
                      (click)="refuse(row)"
                    >Refuser</button>
                    <button
                      type="button"
                      class="btn-assign"
                      (click)="openAssign(row)"
                      aria-label="Assigner employé"
                    >
                      <mat-icon>person_add</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="8" class="empty">Aucune réservation.</td></tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modale assignation -->
      @if (assignTarget()) {
        <div class="overlay" (click)="closeAssign()" role="dialog" aria-modal="true" aria-label="Assigner un employé">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-head">
              <h2>Assigner un événementialiste</h2>
              <button type="button" (click)="closeAssign()" aria-label="Fermer"><mat-icon>close</mat-icon></button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">
                {{ assignTarget()!.event?.title || '—' }} — {{ assignTarget()!.user?.email || '—' }}
              </p>
              <label class="modal-label" for="event-assign-sel">Employé</label>
              <select id="event-assign-sel" [(ngModel)]="selectedEmployeeId" class="status-sel wide">
                <option value="">— Désassigner —</option>
                @for (emp of evenementialistes(); track emp.id) {
                  <option [value]="emp.id">{{ emp.firstname }} {{ emp.lastname }}{{ emp.specialty ? ' — ' + emp.specialty : '' }}</option>
                }
              </select>
            </div>
            <div class="modal-foot">
              <button type="button" class="btn-cancel" (click)="closeAssign()">Fermer</button>
              <button type="button" class="btn-save" [disabled]="assigning()" (click)="saveAssign()">
                {{ assigning() ? 'Enregistrement…' : 'Confirmer' }}
              </button>
            </div>
          </div>
        </div>
      }
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { border:1px solid var(--line); border-radius:12px; padding:14px 16px; display:flex; justify-content:space-between; align-items:center; }
    .head h1 { margin:0; font-size:1.25rem; }
    .head p  { margin:4px 0 0; color:#60748d; font-size:.85rem; }
    .btn-refresh { background:none; border:1px solid #d0dde8; border-radius:8px; padding:6px; cursor:pointer; display:flex; align-items:center; }
    .loading { display:flex; align-items:center; gap:10px; color:#60748d; padding:1rem; }
    .alert { padding:10px 12px; border-radius:10px; margin:0; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok    { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
    .table-wrap { border:1px solid var(--line); border-radius:12px; overflow-x:auto; }
    table { width:100%; border-collapse:collapse; min-width:1000px; }
    th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #eef2f8; vertical-align:middle; }
    th { font-size:.8rem; text-transform:uppercase; letter-spacing:.04em; color:#7a8fa5; background:#fafbfc; }
    .strong { font-weight:700; color:#1a2e40; }
    .muted   { font-size:.82rem; color:#8a9ab0; }
    .badge { border-radius:999px; padding:3px 9px; font-size:.75rem; font-weight:700; border:1px solid; }
    .st-pending   { background:#fff8e1; border-color:#ffe082; color:#7a5c00; }
    .st-validated { background:#e8f5e9; border-color:#a5d6a7; color:#1b5e20; }
    .st-paid      { background:#e3f2fd; border-color:#90caf9; color:#0d47a1; }
    .st-refused   { background:#fce4ec; border-color:#f48fb1; color:#880e4f; }
    .st-cancelled { background:#f5f5f5; border-color:#bdbdbd; color:#616161; }
    .assignee-chip { background:#f3e5f5; color:#4a148c; border-radius:999px; padding:2px 8px; font-size:.75rem; font-weight:700; }
    .actions { display:flex; gap:6px; align-items:center; flex-wrap:wrap; }
    button { height:32px; border:none; border-radius:8px; background:#2f6eb8; color:#fff; font-weight:700; padding:0 10px; cursor:pointer; font-size:.82rem; }
    button:disabled { opacity:.5; cursor:not-allowed; }
    button.danger { background:#d64b3f; }
    .btn-assign { background:none; border:1px solid #d0dde8; height:32px; width:32px; display:flex; align-items:center; justify-content:center; color:#4a6078; padding:0; }
    .btn-assign:hover { background:#f0f4f8; }
    .status-sel { border:1px solid #d0dde8; border-radius:8px; padding:5px 8px; font-size:.8rem; background:#fff; cursor:pointer; }
    .status-sel.wide { width:100%; }
    .empty { text-align:center; color:#8a9ab0; padding:2rem !important; }
    .overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:2000; padding:1rem; }
    .modal { background:#fff; border-radius:14px; width:100%; max-width:420px; overflow:hidden; }
    .modal-head { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid #f0f0f0; }
    .modal-head h2 { margin:0; font-size:1.05rem; }
    .modal-head button { background:none; border:none; cursor:pointer; display:flex; align-items:center; color:#555; height:auto; }
    .modal-body { padding:16px; display:grid; gap:10px; }
    .modal-sub { margin:0; font-size:.85rem; color:#60748d; }
    .modal-label { font-size:.8rem; font-weight:700; color:#4a6078; }
    .modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid #f0f0f0; }
    .btn-cancel { background:#fff; border:1px solid #d0dde8; border-radius:8px; padding:7px 14px; cursor:pointer; font-weight:600; color:#4a6078; height:auto; }
    .btn-save   { background:#c62828; border:none; border-radius:8px; padding:7px 16px; cursor:pointer; font-weight:700; color:#fff; height:auto; }
    .btn-save:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class EventsBookingsManagementComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly rows      = signal<EventBookingRow[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly loading   = signal(true);
  readonly error     = signal<string | null>(null);
  readonly notice    = signal<string | null>(null);
  readonly assigning = signal(false);
  readonly assignTarget = signal<EventBookingRow | null>(null);
  selectedEmployeeId = '';

  readonly evenementialistes = () =>
    this.employees().filter((e) => !e.specialty || e.specialty === 'evenementialiste');

  ngOnInit(): void {
    this.load();
    this.loadEmployees();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<EventBookingRow[]>('/c-event/bookings').subscribe({
      next: (data) => { this.rows.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message ?? "Impossible de charger les réservations C'Events."); this.loading.set(false); },
    });
  }

  loadEmployees(): void {
    this.api.get<{ data: Employee[] } | Employee[]>('/admin/users?role=employee&limit=200').subscribe({
      next: (res) => { this.employees.set(Array.isArray(res) ? res : (res as any).data ?? []); },
      error: () => {},
    });
  }

  employeeName(id: string): string {
    const emp = this.employees().find((e) => e.id === id);
    return emp ? `${emp.firstname} ${emp.lastname}`.trim() : id.substring(0, 8);
  }

  fullName(row: EventBookingRow): string {
    const name = `${row.user?.firstname ?? ''} ${row.user?.lastname ?? ''}`.trim();
    return name || 'Client';
  }

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      PENDING: 'En attente', VALIDATED: 'Validée', REFUSED: 'Refusée',
      PAID: 'Payée', CANCELLED: 'Annulée',
    };
    return map[s] ?? s;
  }

  categoryLabel(cat?: string): string {
    if (!cat) return '';
    const map: Record<string, string> = {
      MARIAGE: 'Mariage', BAPTEME: 'Baptême', ANNIVERSAIRE: 'Anniversaire',
      DEUIL: 'Deuil', SOUTENANCE: 'Soutenance', CONFERENCE: 'Conférence',
      SEMINAIRE: 'Séminaire', SURPRISE: 'Surprise',
    };
    return map[cat] ?? cat;
  }

  validate(row: EventBookingRow): void {
    this.error.set(null); this.notice.set(null);
    this.api.patch(`/c-event/bookings/${row.id}/validate`, {}).subscribe({
      next: () => { this.notice.set('Réservation validée.'); this.load(); },
      error: (err) => this.error.set(err?.error?.message ?? 'Validation impossible.'),
    });
  }

  refuse(row: EventBookingRow): void {
    this.error.set(null); this.notice.set(null);
    this.api.patch(`/c-event/bookings/${row.id}/refuse`, {}).subscribe({
      next: () => { this.notice.set('Réservation refusée.'); this.load(); },
      error: (err) => this.error.set(err?.error?.message ?? 'Refus impossible.'),
    });
  }

  openAssign(row: EventBookingRow): void {
    this.assignTarget.set(row);
    this.selectedEmployeeId = row.assignedEmployeeId ?? '';
    this.notice.set(null);
    this.error.set(null);
  }

  closeAssign(): void { this.assignTarget.set(null); }

  saveAssign(): void {
    const target = this.assignTarget();
    if (!target) return;
    this.assigning.set(true);
    this.api.patch(`/c-event/bookings/${target.id}/assign`, {
      employeeId: this.selectedEmployeeId || null,
    }).subscribe({
      next: () => {
        this.assigning.set(false);
        this.notice.set('Assignation enregistrée.');
        this.closeAssign();
        this.load();
      },
      error: (err) => { this.assigning.set(false); this.error.set(err?.error?.message ?? 'Erreur assignation'); },
    });
  }
}
