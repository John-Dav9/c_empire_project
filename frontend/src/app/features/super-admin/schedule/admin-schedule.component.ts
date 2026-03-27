import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

interface EmployeeAvailability {
  id: string;
  date: string;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
  note?: string;
  employee: { id: string; firstname: string; lastname: string; email: string; specialty?: string };
}

interface MissionSchedule {
  id: string;
  title: string;
  description?: string;
  date: string;
  startTime: string;
  endTime: string;
  employee: { id: string; firstname: string; lastname: string; email: string };
  scheduledBy?: { firstname: string; lastname: string };
  task?: { id: string; title: string };
}

interface Employee {
  id: string;
  firstname: string;
  lastname: string;
  email: string;
  specialty?: string;
}

@Component({
  selector: 'app-admin-schedule',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="schedule-page">
      <div class="schedule-header">
        <h1>📆 Agendas des Employés</h1>
        <button class="btn btn-primary" (click)="openAssignModal()">➕ Planifier une mission</button>
      </div>

      @if (error) {
        <div class="alert-error">{{ error }}</div>
      }

      <!-- Filter by employee -->
      <div class="filter-bar">
        <select [(ngModel)]="selectedEmployeeId" (ngModelChange)="onEmployeeFilter()" class="form-control">
          <option value="">Tous les employés</option>
          @for (emp of employees; track emp.id) {
            <option [value]="emp.id">{{ emp.firstname }} {{ emp.lastname }}</option>
          }
        </select>
      </div>

      <!-- Missions planifiées -->
      <section class="section">
        <h2>📋 Missions planifiées</h2>
        @if (filteredMissions.length === 0) {
          <p class="empty">Aucune mission planifiée.</p>
        } @else {
          <div class="entries-list">
            @for (m of filteredMissions; track m.id) {
              <div class="entry-card mission-card">
                <div class="entry-date">
                  <span class="date-day">{{ formatDay(m.date) }}</span>
                  <span class="date-month">{{ formatMonth(m.date) }}</span>
                </div>
                <div class="entry-details">
                  <strong>{{ m.title }}</strong>
                  <div class="employee-tag">
                    👷 {{ m.employee.firstname }} {{ m.employee.lastname }}
                  </div>
                  @if (m.description) {
                    <p class="entry-desc">{{ m.description }}</p>
                  }
                  <div class="entry-meta">
                    <span>🕐 {{ m.startTime }} – {{ m.endTime }}</span>
                    @if (m.task) { <span>🔗 {{ m.task.title }}</span> }
                  </div>
                </div>
                <button class="btn-icon" (click)="deleteMission(m.id)" title="Supprimer">🗑️</button>
              </div>
            }
          </div>
        }
      </section>

      <!-- Disponibilités des employés -->
      <section class="section">
        <h2>✅ Disponibilités déclarées</h2>
        @if (filteredAvailabilities.length === 0) {
          <p class="empty">Aucune disponibilité trouvée.</p>
        } @else {
          <div class="entries-list">
            @for (a of filteredAvailabilities; track a.id) {
              <div class="entry-card" [class.unavailable]="!a.isAvailable">
                <div class="entry-date">
                  <span class="date-day">{{ formatDay(a.date) }}</span>
                  <span class="date-month">{{ formatMonth(a.date) }}</span>
                </div>
                <div class="entry-details">
                  <div class="employee-tag">👷 {{ a.employee.firstname }} {{ a.employee.lastname }}</div>
                  <span class="avail-badge" [class.avail-yes]="a.isAvailable" [class.avail-no]="!a.isAvailable">
                    {{ a.isAvailable ? 'Disponible' : 'Indisponible' }}
                  </span>
                  <div class="entry-meta">
                    <span>🕐 {{ a.startTime }} – {{ a.endTime }}</span>
                    @if (a.note) { <span>📝 {{ a.note }}</span> }
                  </div>
                </div>
                <button class="btn btn-small btn-primary" (click)="prefillMissionFromAvailability(a)" title="Planifier une mission sur ce créneau">
                  📌 Planifier
                </button>
              </div>
            }
          </div>
        }
      </section>
    </div>

    <!-- Assign mission modal -->
    @if (showModal) {
      <div class="modal-overlay" (click)="closeModal()">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>Planifier une mission</h2>
            <button class="close-btn" (click)="closeModal()">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>Employé *</label>
              <select [(ngModel)]="missionForm.employeeId" name="employeeId" class="form-control">
                <option value="">Sélectionner un employé...</option>
                @for (emp of employees; track emp.id) {
                  <option [value]="emp.id">{{ emp.firstname }} {{ emp.lastname }}</option>
                }
              </select>
            </div>
            <div class="form-group">
              <label>Titre de la mission *</label>
              <input [(ngModel)]="missionForm.title" name="title" class="form-control" placeholder="ex: Livraison zone Nord">
            </div>
            <div class="form-group">
              <label>Description (optionnel)</label>
              <textarea [(ngModel)]="missionForm.description" name="description" class="form-control" rows="2"></textarea>
            </div>
            <div class="form-group">
              <label>Date *</label>
              <input type="date" [(ngModel)]="missionForm.date" name="date" class="form-control">
            </div>
            <div class="form-row">
              <div class="form-group">
                <label>Heure début *</label>
                <input type="time" [(ngModel)]="missionForm.startTime" name="startTime" class="form-control">
              </div>
              <div class="form-group">
                <label>Heure fin *</label>
                <input type="time" [(ngModel)]="missionForm.endTime" name="endTime" class="form-control">
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="closeModal()">Annuler</button>
            <button class="btn btn-primary" (click)="saveMission()"
              [disabled]="saving || !missionForm.employeeId || !missionForm.title || !missionForm.date || !missionForm.startTime || !missionForm.endTime">
              {{ saving ? 'Enregistrement...' : 'Planifier' }}
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: [`
    .schedule-page { padding: 2rem; max-width: 960px; margin: 0 auto; }
    .schedule-header {
      display: flex; justify-content: space-between; align-items: center; margin-bottom: 1.5rem;
      h1 { margin: 0; font-size: 1.8rem; font-weight: 700; }
    }
    .filter-bar { margin-bottom: 1.5rem; max-width: 320px; }
    .section { margin-bottom: 2.5rem; h2 { font-size: 1.1rem; font-weight: 700; margin: 0 0 1rem; color: #333; } }
    .empty { color: #888; font-style: italic; }
    .entries-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .entry-card {
      display: flex; align-items: flex-start; gap: 1rem;
      padding: 1rem 1.25rem; background: #fff; border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.08); border-left: 4px solid #1f8d7d;
      &.mission-card { border-left-color: #3b5bdb; }
      &.unavailable { border-left-color: #dc3545; opacity: 0.85; }
    }
    .entry-date {
      display: flex; flex-direction: column; align-items: center; min-width: 44px;
      .date-day { font-size: 1.5rem; font-weight: 800; line-height: 1; color: #1a1a1a; }
      .date-month { font-size: 0.7rem; text-transform: uppercase; color: #888; letter-spacing: 0.05em; }
    }
    .entry-details {
      flex: 1;
      strong { font-size: 1rem; }
      .employee-tag { font-size: 0.82rem; color: #3b5bdb; font-weight: 600; margin: 0.2rem 0; }
      .entry-desc { color: #666; font-size: 0.875rem; margin: 0.2rem 0; }
      .entry-meta { display: flex; flex-wrap: wrap; gap: 0.75rem; margin-top: 0.4rem; span { font-size: 0.82rem; color: #555; } }
    }
    .avail-badge {
      display: inline-block; padding: 0.2rem 0.6rem; border-radius: 8px; font-size: 0.78rem; font-weight: 700; margin-bottom: 0.3rem;
      &.avail-yes { background: #d4edda; color: #155724; }
      &.avail-no  { background: #f8d7da; color: #721c24; }
    }
    .btn-icon { background: none; border: none; font-size: 1.1rem; cursor: pointer; padding: 0.2rem; align-self: center; }
    .alert-error { background: #f8d7da; color: #721c24; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1rem; }
    .btn {
      padding: 0.65rem 1.25rem; border: none; border-radius: 8px; font-weight: 600; cursor: pointer; font-size: 0.95rem;
      &.btn-primary { background: #3b5bdb; color: #fff; &:hover:not(:disabled) { background: #2f4abf; } }
      &.btn-secondary { background: #6c757d; color: #fff; }
      &.btn-small { padding: 0.35rem 0.75rem; font-size: 0.8rem; align-self: center; white-space: nowrap; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
    .form-control {
      width: 100%; padding: 0.65rem; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; box-sizing: border-box;
      &:focus { outline: none; border-color: #3b5bdb; }
    }
    .form-group { margin-bottom: 1.1rem; label { display: block; margin-bottom: 0.4rem; font-weight: 600; font-size: 0.9rem; } }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 1rem; }
    .modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.45); display: flex; align-items: center; justify-content: center; z-index: 1200; }
    .modal {
      background: #fff; border-radius: 14px; width: 90%; max-width: 520px; box-shadow: 0 8px 32px rgba(0,0,0,0.18);
      .modal-header { display: flex; justify-content: space-between; align-items: center; padding: 1.2rem 1.5rem; border-bottom: 1px solid #eee; h2 { margin: 0; font-size: 1.2rem; } .close-btn { background: none; border: none; font-size: 1.3rem; cursor: pointer; } }
      .modal-body { padding: 1.5rem; }
      .modal-footer { display: flex; justify-content: flex-end; gap: 0.75rem; padding: 1rem 1.5rem; border-top: 1px solid #eee; }
    }
  `]
})
export class AdminScheduleComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private readonly scheduleApiUrl = buildApiUrl('/schedule');
  private readonly adminApiUrl = buildApiUrl('/admin');

  availabilities: EmployeeAvailability[] = [];
  missions: MissionSchedule[] = [];
  employees: Employee[] = [];
  error: string | null = null;
  selectedEmployeeId = '';
  showModal = false;
  saving = false;

  missionForm = this.emptyMissionForm();

  get filteredAvailabilities(): EmployeeAvailability[] {
    if (!this.selectedEmployeeId) return this.availabilities;
    return this.availabilities.filter(a => a.employee.id === this.selectedEmployeeId);
  }

  get filteredMissions(): MissionSchedule[] {
    if (!this.selectedEmployeeId) return this.missions;
    return this.missions.filter(m => m.employee.id === this.selectedEmployeeId);
  }

  ngOnInit() {
    this.loadAll();
  }

  private loadAll() {
    this.http.get<EmployeeAvailability[]>(`${this.scheduleApiUrl}/availability/all`).subscribe({
      next: (data) => { this.availabilities = data; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.http.get<MissionSchedule[]>(`${this.scheduleApiUrl}/missions/all`).subscribe({
      next: (data) => { this.missions = data; this.cdr.markForCheck(); },
      error: () => {}
    });
    this.http.get<any>(`${this.adminApiUrl}/users?role=employee&limit=200`).subscribe({
      next: (res) => {
        this.employees = (res.data ?? res ?? []).map((u: any) => ({
          id: u.id, firstname: u.firstname, lastname: u.lastname, email: u.email, specialty: u.specialty
        }));
        this.cdr.markForCheck();
      },
      error: () => {}
    });
  }

  onEmployeeFilter() {
    this.cdr.markForCheck();
  }

  openAssignModal() {
    this.missionForm = this.emptyMissionForm();
    this.showModal = true;
  }

  closeModal() {
    this.showModal = false;
  }

  prefillMissionFromAvailability(a: EmployeeAvailability) {
    this.missionForm = {
      employeeId: a.employee.id,
      title: '',
      description: '',
      date: a.date,
      startTime: a.startTime,
      endTime: a.endTime,
    };
    this.showModal = true;
    this.cdr.markForCheck();
  }

  saveMission() {
    if (!this.missionForm.employeeId || !this.missionForm.title || !this.missionForm.date) return;
    this.saving = true;
    this.http.post<MissionSchedule>(`${this.scheduleApiUrl}/missions`, this.missionForm).subscribe({
      next: (created) => {
        this.loadAll();
        this.closeModal();
        this.saving = false;
        this.cdr.markForCheck();
      },
      error: (err) => {
        this.error = err.error?.message || 'Erreur lors de la planification';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  deleteMission(id: string) {
    if (!confirm('Supprimer cette mission planifiée ?')) return;
    this.http.delete(`${this.scheduleApiUrl}/missions/${id}`).subscribe({
      next: () => {
        this.missions = this.missions.filter(m => m.id !== id);
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

  private emptyMissionForm() {
    return { employeeId: '', title: '', description: '', date: '', startTime: '', endTime: '' };
  }
}
