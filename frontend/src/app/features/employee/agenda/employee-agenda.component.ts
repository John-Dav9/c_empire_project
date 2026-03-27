import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

interface Availability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  note?: string;
}

interface MissionSchedule {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  scheduledBy?: { email: string; firstname: string; lastname: string };
  task?: { title: string };
}

@Component({
  selector: 'app-employee-agenda',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="agenda-page">
      <div class="agenda-header">
        <h1>📅 Mon Agenda</h1>
        <button class="btn btn-primary" (click)="openAdd()">➕ Ajouter une disponibilité</button>
      </div>

      @if (error) {
        <div class="alert alert-error">{{ error }}</div>
      }

      <!-- Missions programmées par l'admin -->
      <section class="section">
        <h2>📋 Missions planifiées</h2>
        @if (missions.length === 0) {
          <p class="empty">Aucune mission planifiée pour le moment.</p>
        } @else {
          <div class="entries-list">
            @for (m of missions; track m.id) {
              <div class="entry-card mission-card">
                <div class="entry-date">
                  <span class="date-day">{{ formatDay(m.date) }}</span>
                  <span class="date-month">{{ formatMonth(m.date) }}</span>
                </div>
                <div class="entry-details">
                  <strong>{{ m.title }}</strong>
                  @if (m.description) {
                    <p class="entry-desc">{{ m.description }}</p>
                  }
                  <div class="entry-meta">
                    <span>🕐 {{ m.startTime }} – {{ m.endTime }}</span>
                    @if (m.scheduledBy) {
                      <span>👤 Par {{ m.scheduledBy.firstname }} {{ m.scheduledBy.lastname }}</span>
                    }
                    @if (m.task) {
                      <span>🔗 {{ m.task.title }}</span>
                    }
                  </div>
                </div>
              </div>
            }
          </div>
        }
      </section>

      <!-- Disponibilités personnelles -->
      <section class="section">
        <h2>✅ Mes disponibilités</h2>
        @if (availabilities.length === 0) {
          <p class="empty">Aucune disponibilité enregistrée.</p>
        } @else {
          <div class="entries-list">
            @for (a of availabilities; track a.id) {
              <div class="entry-card" [class.unavailable]="!a.isAvailable">
                <div class="entry-date">
                  <span class="date-day">{{ formatDay(a.date) }}</span>
                  <span class="date-month">{{ formatMonth(a.date) }}</span>
                </div>
                <div class="entry-details">
                  <span class="avail-badge" [class.avail-yes]="a.isAvailable" [class.avail-no]="!a.isAvailable">
                    {{ a.isAvailable ? 'Disponible' : 'Indisponible' }}
                  </span>
                  <div class="entry-meta">
                    <span>🕐 {{ a.startTime }} – {{ a.endTime }}</span>
                    @if (a.note) { <span>📝 {{ a.note }}</span> }
                  </div>
                </div>
                <div class="entry-actions">
                  <button class="btn-icon" (click)="deleteAvailability(a.id)" title="Supprimer">🗑️</button>
                </div>
              </div>
            }
          </div>
        }
      </section>
    </div>

    <!-- Add availability modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Ajouter une disponibilité</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Date *</label>
              <input type="date" [(ngModel)]="form.date" name="date" class="form-control" [min]="today">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Heure de début *</label>
                <input type="time" [(ngModel)]="form.startTime" name="startTime" class="form-control">
              </div>
              <div class="form-group">
                <label>Heure de fin *</label>
                <input type="time" [(ngModel)]="form.endTime" name="endTime" class="form-control">
              </div>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="form.isAvailable" name="isAvailable">
                Je suis disponible sur ce créneau
              </label>
            </div>
            <div class="form-group">
              <label>Note (optionnel)</label>
              <input [(ngModel)]="form.note" name="note" class="form-control" placeholder="Précision, contrainte...">
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="save()" [disabled]="saving || !form.date || !form.startTime || !form.endTime">
              {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .agenda-page {
      padding: 2rem;
      max-width: 860px;
      margin: 0 auto;
    }
    .agenda-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
    }
    .section {
      margin-bottom: 2.5rem;
      h2 { font-size: 1.15rem; font-weight: 700; margin: 0 0 1rem; color: #333; }
    }
    .empty { color: #888; font-style: italic; }
    .entries-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .entry-card {
      display: flex;
      align-items: flex-start;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: #fff;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08);
      border-left: 4px solid #1f8d7d;
      &.mission-card { border-left-color: #3b5bdb; }
      &.unavailable { border-left-color: #dc3545; opacity: 0.85; }
    }
    .entry-date {
      display: flex;
      flex-direction: column;
      align-items: center;
      min-width: 44px;
      .date-day { font-size: 1.5rem; font-weight: 800; line-height: 1; color: #1a1a1a; }
      .date-month { font-size: 0.7rem; text-transform: uppercase; color: #888; letter-spacing: 0.05em; }
    }
    .entry-details {
      flex: 1;
      strong { font-size: 1rem; }
      .entry-desc { color: #666; font-size: 0.875rem; margin: 0.25rem 0; }
      .entry-meta {
        display: flex;
        flex-wrap: wrap;
        gap: 0.75rem;
        margin-top: 0.4rem;
        span { font-size: 0.82rem; color: #555; }
      }
    }
    .avail-badge {
      display: inline-block;
      padding: 0.2rem 0.6rem;
      border-radius: 8px;
      font-size: 0.78rem;
      font-weight: 700;
      margin-bottom: 0.3rem;
      &.avail-yes { background: #d4edda; color: #155724; }
      &.avail-no  { background: #f8d7da; color: #721c24; }
    }
    .entry-actions { display: flex; align-items: center; }
    .btn-icon {
      background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 0.2rem;
      &:hover { transform: scale(1.15); }
    }
    .alert-error { background: #f8d7da; color: #721c24; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .btn {
      padding: 0.65rem 1.25rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem;
      &.btn-primary { background: #1f8d7d; color: #fff; &:hover:not(:disabled) { background: #197a6c; } }
      &.btn-secondary { background: #6c757d; color: #fff; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .modal-overlay {
      position: fixed; inset: 0; background: rgba(0,0,0,0.45);
      display: flex; align-items: center; justify-content: center; z-index: 1200;
    }
    .modal {
      background: #fff; border-radius: 14px; width: 90%; max-width: 480px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      .modal-header {
        display: flex; justify-content: space-between; align-items: center;
        padding: 1.2rem 1.5rem; border-bottom: 1px solid #eee;
        h2 { margin: 0; font-size: 1.2rem; }
        .close-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; }
      }
      .modal-body { padding: 1.5rem; }
      .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #eee; }
    }
    .form-group {
      margin-bottom: 1.1rem;
      label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.9rem; }
      .form-control {
        width: 100%; padding: 0.65rem; border: 1px solid #ddd; border-radius: 8px;
        font-size: 0.95rem; box-sizing: border-box;
        &:focus { outline: none; border-color: #1f8d7d; }
      }
      .checkbox-label { display: flex; align-items: center; gap: 0.5rem; cursor: pointer; }
    }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
  `]
})
export class EmployeeAgendaComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private readonly scheduleApiUrl = buildApiUrl('/schedule');

  availabilities: Availability[] = [];
  missions: MissionSchedule[] = [];
  error: string | null = null;
  showModal = false;
  saving = false;
  readonly today = new Date().toISOString().split('T')[0];

  form = this.emptyForm();

  ngOnInit() {
    this.loadData();
  }

  private loadData() {
    this.http.get<Availability[]>(`${this.scheduleApiUrl}/availability/me`).subscribe({
      next: (data) => { this.availabilities = data; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.http.get<MissionSchedule[]>(`${this.scheduleApiUrl}/missions/me`).subscribe({
      next: (data) => { this.missions = data; this.cdr.markForCheck(); },
      error: () => {}
    });
  }

  openAdd() {
    this.form = this.emptyForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  save() {
    if (!this.form.date || !this.form.startTime || !this.form.endTime) return;
    this.saving = true;
    this.http.post<Availability>(`${this.scheduleApiUrl}/availability`, this.form).subscribe({
      next: (created) => {
        this.availabilities = [...this.availabilities, created];
        this.closeModal();
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de l\'enregistrement';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteAvailability(id: string) {
    if (!confirm('Supprimer ce créneau ?')) return;
    this.http.delete(`${this.scheduleApiUrl}/availability/${id}`).subscribe({
      next: () => {
        this.availabilities = this.availabilities.filter(a => a.id !== id);
        this.cdr.markForCheck();
      },
      error: () => { this.error = 'Erreur lors de la suppression'; this.cdr.markForCheck(); }
    });
  }

  formatDay(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').getDate().toString().padStart(2, '0');
  }

  formatMonth(dateStr: string): string {
    return new Date(dateStr + 'T00:00:00').toLocaleString('fr-FR', { month: 'short' });
  }

  private emptyForm() {
    return { date: '', startTime: '', endTime: '', isAvailable: true, note: '' };
  }
}
