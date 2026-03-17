import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { AuthService } from '../../../core/services/auth.service';

type TodoRequestStatus =
  | 'pending'
  | 'confirmed'
  | 'in_progress'
  | 'completed'
  | 'cancelled';

type TodoServiceItem = {
  id: string;
  title: string;
  description?: string;
  basePrice: number;
};

type TodoRequestItem = {
  id: string;
  todoServiceId: string;
  serviceTitle: string;
  scheduledAt: string;
  instructions?: string;
  address: string;
  amount: number;
  currency: string;
  status: TodoRequestStatus;
  createdAt?: string;
};

@Component({
  selector: 'app-client-todo-requests',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <section class="todo-client page-enter">
      <header class="head app-shell-card">
        <div>
          <h1>Mes missions C'To-Do</h1>
          <p>Planifiez une mission et suivez son execution en temps reel.</p>
        </div>
      </header>

      <section class="panel app-shell-card">
        <h2>Nouvelle mission</h2>
        <p class="error" *ngIf="error">{{ error }}</p>
        <p class="ok" *ngIf="success">{{ success }}</p>

        <form class="form-grid" (ngSubmit)="createRequest()">
          <label>
            Service
            <select [(ngModel)]="form.todoServiceId" name="todoServiceId" required>
              <option value="">Selectionner un service</option>
              <option *ngFor="let service of services" [value]="service.id">
                {{ service.title }} - {{ service.basePrice | currency:'XAF' }}
              </option>
            </select>
          </label>

          <label>
            Date et heure
            <input type="datetime-local" [(ngModel)]="form.scheduledAt" name="scheduledAt" required />
          </label>

          <label class="full">
            Adresse d'intervention
            <input type="text" [(ngModel)]="form.address" name="address" required />
          </label>

          <label class="full">
            Instructions
            <textarea rows="3" [(ngModel)]="form.instructions" name="instructions"></textarea>
          </label>

          <button type="submit" [disabled]="saving">{{ saving ? 'Envoi...' : 'Enregistrer la mission' }}</button>
        </form>
      </section>

      <section class="panel app-shell-card">
        <h2>Mes demandes</h2>
        <div class="empty" *ngIf="!loading && requests.length === 0">Aucune mission pour le moment.</div>
        <div class="empty" *ngIf="loading">Chargement...</div>

        <article class="request" *ngFor="let item of requests">
          <div class="request-top">
            <strong>{{ item.serviceTitle }}</strong>
            <span class="status" [ngClass]="item.status">{{ statusLabel(item.status) }}</span>
          </div>
          <p>{{ item.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</p>
          <p>{{ item.address }}</p>
          <p class="notes" *ngIf="item.instructions">{{ item.instructions }}</p>
          <div class="meta">
            <span>Montant: {{ item.amount | currency:(item.currency || 'XAF') }}</span>
          </div>
        </article>
      </section>
    </section>
  `,
  styles: [`
    .todo-client { display:grid; gap:14px; }
    .head, .panel { border:1px solid var(--line); padding:16px; }
    .head h1, .panel h2 { margin:0; }
    .head p { margin:6px 0 0; color:var(--ink-2); }
    .form-grid { margin-top:12px; display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; }
    .form-grid label { display:grid; gap:6px; color:var(--ink-1); font-weight:700; }
    .form-grid input, .form-grid select, .form-grid textarea {
      border:1px solid var(--line); border-radius:10px; padding:10px; background:#fff;
    }
    .form-grid .full { grid-column:1 / -1; }
    .form-grid button {
      grid-column:1 / -1; border:none; border-radius:12px; padding:11px 14px;
      background:#1f6fb2; color:#fff; font-weight:800; cursor:pointer;
    }
    .empty { color:var(--ink-2); padding:12px 0; }
    .request { border:1px solid var(--line); border-radius:14px; padding:12px; margin-top:10px; background:#fff; }
    .request-top { display:flex; justify-content:space-between; align-items:center; gap:10px; }
    .request p { margin:6px 0 0; color:var(--ink-2); }
    .notes { color:var(--ink-1); }
    .meta { margin-top:8px; font-weight:700; color:#1f6fb2; }
    .status { border-radius:999px; padding:4px 10px; font-size:.78rem; font-weight:800; border:1px solid transparent; }
    .status.pending { background:#fff7e7; color:#9a6510; border-color:#f0dfb4; }
    .status.confirmed { background:#edf4ff; color:#275e9a; border-color:#cfe0f7; }
    .status.in_progress { background:#e9fbf9; color:#0f756d; border-color:#c0ece7; }
    .status.completed { background:#eaf8ed; color:#25753a; border-color:#c7e9cf; }
    .status.cancelled { background:#fff0f0; color:#992e2e; border-color:#f1c0c0; }
    .error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; border-radius:10px; padding:8px 10px; margin:10px 0 0; }
    .ok { background:#eefbf7; border:1px solid #b9eadf; color:#0b6557; border-radius:10px; padding:8px 10px; margin:10px 0 0; }
    @media (max-width: 760px) { .form-grid { grid-template-columns:1fr; } }
  `],
})
export class ClientTodoRequestsComponent implements OnInit {
  services: TodoServiceItem[] = [];
  requests: TodoRequestItem[] = [];
  loading = false;
  saving = false;
  error: string | null = null;
  success: string | null = null;

  form = {
    todoServiceId: '',
    scheduledAt: '',
    address: '',
    instructions: '',
  };

  constructor(
    private readonly api: ApiService,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    this.loadServices();
    this.loadRequests();
  }

  createRequest(): void {
    this.error = null;
    this.success = null;

    const selected = this.services.find((s) => s.id === this.form.todoServiceId);
    const user = this.authService.getCurrentUser();
    const email = user?.email || '';
    const fallbackName = email ? email.split('@')[0] : 'Client';

    if (!selected || !email || !this.form.scheduledAt || !this.form.address.trim()) {
      this.error = 'Veuillez completer les informations requises.';
      return;
    }

    const payload = {
      fullName: fallbackName,
      email,
      phone: '',
      todoServiceId: selected.id,
      serviceTitle: selected.title,
      instructions: this.form.instructions.trim() || undefined,
      address: this.form.address.trim(),
      scheduledAt: new Date(this.form.scheduledAt).toISOString(),
    };

    this.saving = true;
    this.api.post<TodoRequestItem>('/c-todo/orders', payload).subscribe({
      next: (created) => {
        this.saving = false;
        this.success = 'Mission enregistree.';
        this.requests = [created, ...this.requests];
        this.form = { todoServiceId: '', scheduledAt: '', address: '', instructions: '' };
      },
      error: (err) => {
        this.saving = false;
        this.error = err?.error?.message || 'Creation de mission impossible.';
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

  private loadServices(): void {
    this.api.get<TodoServiceItem[]>('/todo').subscribe({
      next: (services) => {
        this.services = Array.isArray(services) ? services : [];
      },
      error: () => {
        this.error = "Impossible de charger les services C'To-Do.";
      },
    });
  }

  private loadRequests(): void {
    this.loading = true;
    this.api.get<TodoRequestItem[]>('/c-todo/orders/my').subscribe({
      next: (items) => {
        this.loading = false;
        this.requests = Array.isArray(items) ? items : [];
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || 'Impossible de charger vos missions.';
      },
    });
  }
}
