import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
}

@Component({
  selector: 'app-employee-tasks',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="page page-enter">
      <header class="head">
        <div>
          <h1>Mes tâches</h1>
          <p>{{ tasks().length }} tâche{{ tasks().length > 1 ? 's' : '' }} assignée{{ tasks().length > 1 ? 's' : '' }}</p>
        </div>
        <button type="button" class="btn-refresh" (click)="load()" aria-label="Actualiser">
          <mat-icon>refresh</mat-icon>
        </button>
      </header>

      <!-- KPIs -->
      <div class="kpi-row">
        @for (kpi of kpis(); track kpi.label) {
          <div class="kpi-pill" [style.border-bottom-color]="kpi.color">
            <span class="kpi-num" [style.color]="kpi.color">{{ kpi.count }}</span>
            <span class="kpi-lbl">{{ kpi.label }}</span>
          </div>
        }
      </div>

      @if (error()) { <p class="alert error" role="alert">{{ error() }}</p> }

      @if (loading()) {
        <div class="loading"><mat-spinner diameter="32" /><span>Chargement…</span></div>
      }

      @if (!loading()) {
        @if (tasks().length === 0) {
          <div class="empty-state">
            <mat-icon class="empty-icon">assignment</mat-icon>
            <h2>Aucune tâche assignée</h2>
            <p>Vous n'avez pas encore de tâche assignée par l'administration.</p>
          </div>
        } @else {
          <div class="tasks-list">
            @for (task of tasks(); track task.id) {
              <div class="task-card" [class.overdue]="isOverdue(task)">
                <div class="task-top">
                  <div class="task-left">
                    <span class="priority-badge" [class]="'pr-' + task.priority">
                      {{ priorityLabel(task.priority) }}
                    </span>
                    <span class="task-title">{{ task.title }}</span>
                  </div>
                  <span class="status-badge" [class]="'st-' + task.status">
                    {{ statusLabel(task.status) }}
                  </span>
                </div>

                @if (task.description) {
                  <p class="task-desc">{{ task.description }}</p>
                }

                <div class="task-footer">
                  @if (task.dueDate) {
                    <span class="due-date" [class.past]="isOverdue(task)">
                      <mat-icon>schedule</mat-icon>
                      Échéance : {{ task.dueDate | date:'dd/MM/yyyy' }}
                    </span>
                  }
                  <div class="task-actions">
                    @if (task.status === 'pending') {
                      <button
                        type="button"
                        class="btn-start"
                        (click)="updateStatus(task, 'in_progress')"
                      >Démarrer</button>
                    }
                    @if (task.status === 'in_progress') {
                      <button
                        type="button"
                        class="btn-done"
                        (click)="updateStatus(task, 'completed')"
                      >Marquer terminée</button>
                    }
                  </div>
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
    .head { display: flex; justify-content: space-between; align-items: center; }
    .head h1 { margin: 0; font-size: 1.25rem; }
    .head p  { margin: 4px 0 0; color: #60748d; font-size: .85rem; }
    .btn-refresh { background: none; border: 1px solid #d0dde8; border-radius: 8px; padding: 6px; cursor: pointer; display: flex; align-items: center; }
    .kpi-row { display: flex; gap: 10px; flex-wrap: wrap; }
    .kpi-pill {
      display: flex; flex-direction: column; align-items: center;
      padding: 10px 20px; background: #fff; border-radius: 10px;
      border: 1px solid #eef2f8; border-bottom: 3px solid; min-width: 80px;
    }
    .kpi-num { font-size: 1.4rem; font-weight: 800; }
    .kpi-lbl { font-size: .7rem; font-weight: 600; color: #9ab0c8; text-transform: uppercase; letter-spacing: .05em; }
    .loading { display: flex; align-items: center; gap: 10px; color: #60748d; padding: 1rem; }
    .alert { padding: 10px 12px; border-radius: 10px; margin: 0; }
    .alert.error { background: #fff3ef; border: 1px solid #f5c5b7; color: #b92016; }
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { font-size: 4rem; width: 4rem; height: 4rem; color: #c8d8e8; }
    .empty-state h2 { font-size: 1.1rem; color: #1a2e40; margin: 1rem 0 .5rem; }
    .empty-state p  { color: #60748d; }
    .tasks-list { display: grid; gap: 12px; }
    .task-card {
      background: #fff; border: 1px solid #eef2f8; border-radius: 14px;
      padding: 16px; display: grid; gap: 10px;
    }
    .task-card.overdue { border-left: 3px solid #e53935; }
    .task-top { display: flex; justify-content: space-between; align-items: flex-start; gap: 8px; flex-wrap: wrap; }
    .task-left { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .task-title { font-weight: 700; color: #1a2e40; font-size: .95rem; }
    .task-desc { margin: 0; color: #60748d; font-size: .85rem; line-height: 1.5; }
    .priority-badge { border-radius: 999px; padding: 2px 10px; font-size: .72rem; font-weight: 700; }
    .pr-urgent { background: #fce4ec; color: #c62828; }
    .pr-high   { background: #fff3e0; color: #e65100; }
    .pr-medium { background: #e3f2fd; color: #1565c0; }
    .pr-low    { background: #f5f5f5; color: #616161; }
    .status-badge { border-radius: 999px; padding: 3px 10px; font-size: .75rem; font-weight: 700; border: 1px solid; white-space: nowrap; }
    .st-pending     { background: #fff8e1; border-color: #ffe082; color: #7a5c00; }
    .st-in_progress { background: #e3f2fd; border-color: #90caf9; color: #0d47a1; }
    .st-completed   { background: #e8f5e9; border-color: #66bb6a; color: #1b5e20; }
    .st-cancelled   { background: #f5f5f5; border-color: #bdbdbd; color: #616161; }
    .task-footer { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .due-date { display: flex; align-items: center; gap: 4px; font-size: .8rem; color: #60748d; }
    .due-date mat-icon { font-size: 1rem; width: 1rem; height: 1rem; }
    .due-date.past { color: #e53935; font-weight: 700; }
    .task-actions { display: flex; gap: 8px; }
    .btn-start { background: #1565c0; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-weight: 700; font-size: .82rem; }
    .btn-done  { background: #2e7d32; color: #fff; border: none; border-radius: 8px; padding: 6px 14px; cursor: pointer; font-weight: 700; font-size: .82rem; }
  `],
})
export class EmployeeTasksComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly tasks   = signal<Task[]>([]);
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);

  readonly kpis = () => [
    { label: 'Total',      count: this.tasks().length,                                              color: '#1a2e40' },
    { label: 'En attente', count: this.tasks().filter(t => t.status === 'pending').length,          color: '#e65100' },
    { label: 'En cours',   count: this.tasks().filter(t => t.status === 'in_progress').length,      color: '#1565c0' },
    { label: 'Terminées',  count: this.tasks().filter(t => t.status === 'completed').length,        color: '#2e7d32' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<Task[]>('/tasks/my-tasks').subscribe({
      next: (data) => { this.tasks.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message ?? 'Impossible de charger vos tâches.'); this.loading.set(false); },
    });
  }

  updateStatus(task: Task, status: string): void {
    this.api.patch<Task>(`/tasks/${task.id}`, { status }).subscribe({
      next: (updated) => {
        this.tasks.update(list => list.map(t => t.id === updated.id ? updated : t));
      },
      error: (err) => this.error.set(err?.error?.message ?? 'Impossible de mettre à jour.'),
    });
  }

  isOverdue(task: Task): boolean {
    if (!task.dueDate || task.status === 'completed' || task.status === 'cancelled') return false;
    return new Date(task.dueDate) < new Date();
  }

  priorityLabel(p: string): string {
    const m: Record<string, string> = { urgent: 'Urgente', high: 'Haute', medium: 'Moyenne', low: 'Basse' };
    return m[p] ?? p;
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = { pending: 'En attente', in_progress: 'En cours', completed: 'Terminée', cancelled: 'Annulée' };
    return m[s] ?? s;
  }
}
