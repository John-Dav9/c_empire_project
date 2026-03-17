import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../../core/services/api.service';

type TodoRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type TodoRequestItem = {
  id: string;
  serviceTitle: string;
  scheduledAt: string;
  instructions?: string;
  address: string;
  status: TodoRequestStatus;
};

@Component({
  selector: 'app-employee-todo-missions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <section class="todo-employee page-enter">
      <header class="head app-shell-card">
        <h1>Missions C'To-Do</h1>
        <p>Prenez en charge les missions clients et mettez a jour leur avancement.</p>
      </header>

      <section class="board app-shell-card">
        <p class="error" *ngIf="error">{{ error }}</p>
        <p class="empty" *ngIf="loading">Chargement...</p>

        <article class="mission" *ngFor="let item of requests">
          <div class="line">
            <strong>{{ item.serviceTitle }}</strong>
            <span class="status" [ngClass]="item.status">{{ statusLabel(item.status) }}</span>
          </div>
          <p>{{ item.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</p>
          <p>{{ item.address }}</p>
          <p class="notes" *ngIf="item.instructions">{{ item.instructions }}</p>

          <div class="actions">
            <button type="button" (click)="setStatus(item.id, 'confirmed')">Confirmer</button>
            <button type="button" (click)="setStatus(item.id, 'in_progress')">Demarrer</button>
            <button type="button" (click)="setStatus(item.id, 'completed')">Terminer</button>
          </div>
        </article>

        <p class="empty" *ngIf="!loading && requests.length === 0">Aucune mission disponible.</p>
      </section>
    </section>
  `,
  styles: [`
    .todo-employee { display:grid; gap:14px; }
    .head, .board { border:1px solid var(--line); padding:16px; }
    .head h1 { margin:0; }
    .head p { margin:6px 0 0; color:var(--ink-2); }
    .mission { border:1px solid var(--line); border-radius:14px; padding:12px; margin-bottom:10px; background:#fff; }
    .line { display:flex; align-items:center; justify-content:space-between; gap:10px; }
    .mission p { margin:6px 0 0; color:var(--ink-2); }
    .notes { color:var(--ink-1); }
    .actions { margin-top:10px; display:flex; flex-wrap:wrap; gap:8px; }
    .actions button { border:1px solid #cddff2; border-radius:10px; background:#edf5ff; color:#245b93; padding:8px 10px; font-weight:700; cursor:pointer; }
    .status { border-radius:999px; padding:4px 10px; font-size:.78rem; font-weight:800; border:1px solid transparent; }
    .status.pending { background:#fff7e7; color:#9a6510; border-color:#f0dfb4; }
    .status.confirmed { background:#edf4ff; color:#275e9a; border-color:#cfe0f7; }
    .status.in_progress { background:#e9fbf9; color:#0f756d; border-color:#c0ece7; }
    .status.completed { background:#eaf8ed; color:#25753a; border-color:#c7e9cf; }
    .status.cancelled { background:#fff0f0; color:#992e2e; border-color:#f1c0c0; }
    .empty { color:var(--ink-2); margin:0; }
    .error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; border-radius:10px; padding:8px 10px; margin:0 0 10px; }
  `],
})
export class EmployeeTodoMissionsComponent implements OnInit {
  requests: TodoRequestItem[] = [];
  loading = false;
  error: string | null = null;

  constructor(private readonly api: ApiService) {}

  ngOnInit(): void {
    this.load();
  }

  setStatus(id: string, status: TodoRequestStatus): void {
    this.api.patch(`/c-todo/orders/${id}/status`, { status }).subscribe({
      next: (updated: any) => {
        this.requests = this.requests.map((item) =>
          item.id === id ? { ...item, status: updated?.status || status } : item,
        );
      },
      error: (err) => {
        this.error = err?.error?.message || 'Mise a jour du statut impossible.';
      },
    });
  }

  statusLabel(status: TodoRequestStatus): string {
    if (status === 'pending') return 'En attente';
    if (status === 'confirmed') return 'Confirmee';
    if (status === 'in_progress') return 'En cours';
    if (status === 'completed') return 'Terminee';
    return 'Annulee';
  }

  private load(): void {
    this.loading = true;
    this.api.get<TodoRequestItem[]>('/c-todo/orders/missions').subscribe({
      next: (items) => {
        this.loading = false;
        this.requests = Array.isArray(items) ? items : [];
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Impossible de charger les missions.';
      },
    });
  }
}
