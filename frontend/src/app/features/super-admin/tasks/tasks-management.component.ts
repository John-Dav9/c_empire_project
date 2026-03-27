import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { buildApiUrl } from '../../../core/config/api.config';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';

interface Task {
  id: string;
  title: string;
  description?: string;
  status: string;
  priority: string;
  dueDate?: string;
  createdAt: string;
  assignedTo?: { id: string; email: string; firstname?: string; lastname?: string };
  createdBy?: { email: string };
}

interface Employee {
  id: string;
  email: string;
  firstname?: string;
  lastname?: string;
}

@Component({
  selector: 'app-tasks-management',
  imports: [
    DatePipe,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    PageHeaderComponent,
    StatusBadgeComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="tasks-page">
      <app-page-header
        title="Gestion des tâches"
        [subtitle]="tasks().length + ' tâches au total'"
        [breadcrumbs]="[{ label: 'Super Admin', link: '/super-admin/dashboard' }, { label: 'Tâches' }]"
      >
        <button mat-flat-button slot="actions" class="create-btn" (click)="openCreate()">
          <mat-icon>add</mat-icon>
          Nouvelle tâche
        </button>
      </app-page-header>

      <!-- KPIs -->
      <div class="kpi-row">
        @for (kpi of kpis(); track kpi.label) {
          <div class="kpi-pill" [style.border-color]="kpi.color">
            <span class="kpi-num" [style.color]="kpi.color">{{ kpi.count }}</span>
            <span class="kpi-lbl">{{ kpi.label }}</span>
          </div>
        }
      </div>

      <!-- Filtre statut -->
      <div class="filters-row">
        <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()" class="filter-select" aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="in_progress">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
        <select [(ngModel)]="filterPriority" (ngModelChange)="applyFilter()" class="filter-select" aria-label="Filtrer par priorité">
          <option value="">Toutes les priorités</option>
          <option value="urgent">Urgente</option>
          <option value="high">Haute</option>
          <option value="medium">Moyenne</option>
          <option value="low">Basse</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-state"><mat-spinner diameter="40" /></div>
      } @else if (error()) {
        <div class="alert-error" role="alert">{{ error() }}</div>
      } @else {
        <div class="table-wrapper">
          <table class="tasks-table" aria-label="Liste des tâches">
            <thead>
              <tr>
                <th scope="col">Tâche</th>
                <th scope="col">Assignée à</th>
                <th scope="col">Priorité</th>
                <th scope="col">Statut</th>
                <th scope="col">Échéance</th>
                <th scope="col">Créée le</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (task of filtered(); track task.id) {
                <tr>
                  <td>
                    <p class="task-title">{{ task.title }}</p>
                    @if (task.description) {
                      <p class="task-desc">{{ task.description }}</p>
                    }
                  </td>
                  <td>
                    @if (task.assignedTo) {
                      <p class="assignee-name">
                        {{ task.assignedTo.firstname ?? '' }} {{ task.assignedTo.lastname ?? '' }}
                      </p>
                      <p class="assignee-email">{{ task.assignedTo.email }}</p>
                    } @else {
                      <span class="no-assignee">Non assignée</span>
                    }
                  </td>
                  <td><span class="priority-badge" [class]="'priority-' + task.priority">{{ priorityLabel(task.priority) }}</span></td>
                  <td><app-status-badge [status]="task.status" /></td>
                  <td>{{ task.dueDate ? (task.dueDate | date:'dd/MM/yyyy') : '—' }}</td>
                  <td>{{ task.createdAt | date:'dd/MM/yy' }}</td>
                  <td class="actions-cell">
                    <button mat-icon-button (click)="editTask(task)" aria-label="Modifier">
                      <mat-icon>edit</mat-icon>
                    </button>
                    <button mat-icon-button class="delete-btn" (click)="deleteTask(task.id)" aria-label="Supprimer">
                      <mat-icon>delete</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="empty-cell">
                    <mat-icon>assignment</mat-icon>
                    <p>Aucune tâche trouvée</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="pagination">
          <button class="page-btn" (click)="goToPage(page - 1)" [disabled]="page === 1" aria-label="Page précédente">‹</button>
          <span class="page-info">Page {{ page }} / {{ totalPages() }}</span>
          <button class="page-btn" (click)="goToPage(page + 1)" [disabled]="page === totalPages()" aria-label="Page suivante">›</button>
        </div>
      }

      <!-- Drawer création / édition -->
      @if (showForm()) {
        <div class="drawer-overlay" (click)="closeForm()">
          <aside class="drawer" (click)="$event.stopPropagation()" role="dialog" aria-modal="true"
            [attr.aria-label]="editingId() ? 'Modifier la tâche' : 'Créer une tâche'">
            <div class="drawer-header">
              <h2>{{ editingId() ? 'Modifier la tâche' : 'Nouvelle tâche' }}</h2>
              <button mat-icon-button (click)="closeForm()" aria-label="Fermer"><mat-icon>close</mat-icon></button>
            </div>

            <form [formGroup]="form" (ngSubmit)="submit()" class="drawer-form" novalidate>
              <mat-form-field appearance="outline">
                <mat-label>Titre</mat-label>
                <input matInput formControlName="title" />
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Description</mat-label>
                <textarea matInput formControlName="description" rows="3"></textarea>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Assignée à</mat-label>
                <mat-select formControlName="assignedToId">
                  @for (emp of employees(); track emp.id) {
                    <mat-option [value]="emp.id">
                      {{ emp.firstname ?? '' }} {{ emp.lastname ?? '' }} — {{ emp.email }}
                    </mat-option>
                  }
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Priorité</mat-label>
                <mat-select formControlName="priority">
                  <mat-option value="low">Basse</mat-option>
                  <mat-option value="medium">Moyenne</mat-option>
                  <mat-option value="high">Haute</mat-option>
                  <mat-option value="urgent">Urgente</mat-option>
                </mat-select>
              </mat-form-field>

              <mat-form-field appearance="outline">
                <mat-label>Date d'échéance</mat-label>
                <input matInput type="date" formControlName="dueDate" />
              </mat-form-field>

              @if (formError()) {
                <p class="form-error" role="alert">{{ formError() }}</p>
              }

              <div class="drawer-footer">
                <button mat-stroked-button type="button" (click)="closeForm()">Annuler</button>
                <button mat-flat-button type="submit" class="submit-btn" [disabled]="form.invalid || saving()">
                  @if (saving()) { <mat-spinner diameter="18" /> }
                  {{ editingId() ? 'Enregistrer' : 'Créer la tâche' }}
                </button>
              </div>
            </form>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .tasks-page { padding: 2rem; max-width: 1400px; margin: 0 auto; }
    .create-btn { background-color: #c62828; color: white; }

    .kpi-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .kpi-pill {
      display: flex; flex-direction: column; align-items: center;
      padding: 0.75rem 1.5rem; background: white; border-radius: 10px;
      box-shadow: 0 1px 6px rgba(0,0,0,.06); border-bottom: 3px solid;
      min-width: 90px;
    }
    .kpi-num { font-size: 1.5rem; font-weight: 800; }
    .kpi-lbl { font-size: 0.7rem; font-weight: 500; color: #aaa; text-transform: uppercase; letter-spacing: .05em; }

    .filters-row { display: flex; gap: 1rem; margin-bottom: 1.5rem; flex-wrap: wrap; }
    .filter-select {
      padding: .5rem 1rem; border: 1px solid #e0e0e0; border-radius: 8px;
      font-size: .875rem; background: white; min-width: 180px; cursor: pointer;
    }
    .filter-select:focus { outline: none; border-color: #c62828; }

    .loading-state { display: flex; justify-content: center; padding: 3rem; }
    .alert-error { padding: .875rem 1.25rem; border-radius: 8px; background: #fce4ec; color: #c62828; margin-bottom: 1rem; }

    .table-wrapper { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.06); overflow-x: auto; }
    .tasks-table { width: 100%; border-collapse: collapse; }
    .tasks-table thead th {
      padding: 1rem; text-align: left; font-size: .75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em; color: #888;
      background: #fafafa; border-bottom: 1px solid #f0f0f0; white-space: nowrap;
    }
    .tasks-table tbody tr { border-bottom: 1px solid #f5f5f5; transition: background .15s; }
    .tasks-table tbody tr:hover { background: #fafafa; }
    .tasks-table tbody td { padding: .875rem 1rem; font-size: .875rem; color: #333; vertical-align: middle; }

    .task-title { font-weight: 600; color: #1a1a2e; margin: 0 0 .1rem; }
    .task-desc { font-size: .72rem; color: #aaa; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 240px; }
    .assignee-name { font-weight: 600; color: #1a1a2e; margin: 0 0 .1rem; }
    .assignee-email { font-size: .72rem; color: #aaa; margin: 0; }
    .no-assignee { font-size: .8rem; color: #ccc; font-style: italic; }

    .priority-badge {
      display: inline-block; padding: .2rem .65rem; border-radius: 100px;
      font-size: .72rem; font-weight: 700; white-space: nowrap;
    }
    .priority-urgent { background: #fce4ec; color: #c62828; }
    .priority-high    { background: #fff3e0; color: #e65100; }
    .priority-medium  { background: #e3f2fd; color: #1565c0; }
    .priority-low     { background: #f5f5f5; color: #616161; }

    .actions-cell { display: flex; gap: .25rem; align-items: center; }
    .delete-btn { color: #c62828; }

    .empty-cell { text-align: center; padding: 3rem !important; color: #aaa; }
    .empty-cell mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; display: block; margin: 0 auto .5rem; }
    .empty-cell p { margin: 0; }

    /* Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; justify-content: flex-end; }
    .drawer {
      width: 420px; max-width: 100%; background: white; height: 100%;
      overflow-y: auto; box-shadow: -4px 0 24px rgba(0,0,0,.12);
    }
    .drawer-header {
      display: flex; justify-content: space-between; align-items: center;
      padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0;
    }
    .drawer-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
    .drawer-form { padding: 1.5rem; display: flex; flex-direction: column; gap: .75rem; }
    mat-form-field { width: 100%; }
    .form-error { color: #c62828; font-size: .875rem; margin: 0; }
    .drawer-footer { display: flex; justify-content: flex-end; gap: .75rem; margin-top: .5rem; }
    .submit-btn { background-color: #c62828; color: white; display: flex; align-items: center; gap: .4rem; }

    .pagination { display: flex; align-items: center; justify-content: center; gap: 1rem; margin-top: 1.5rem; }
    .page-btn {
      width: 36px; height: 36px; border-radius: 8px; border: 1px solid #e0e0e0;
      background: white; font-size: 1.1rem; cursor: pointer; display: flex; align-items: center; justify-content: center;
      &:hover:not(:disabled) { background: #fce4ec; border-color: #c62828; color: #c62828; }
      &:disabled { opacity: .4; cursor: not-allowed; }
    }
    .page-info { font-size: .875rem; color: #666; }
  `]
})
export class TasksManagementComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly fb = inject(FormBuilder);

  readonly tasks = signal<Task[]>([]);
  readonly filtered = signal<Task[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly showForm = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly editingId = signal<string | null>(null);

  // Pagination
  page = 1;
  readonly pageSize = 20;
  readonly total = signal(0);
  readonly totalPages = signal(1);

  filterStatus = '';
  filterPriority = '';

  readonly kpis = () => [
    { label: 'Total',      count: this.total(),                                                  color: '#1a1a2e' },
    { label: 'En attente', count: this.tasks().filter(t => t.status === 'pending').length,       color: '#e65100' },
    { label: 'En cours',   count: this.tasks().filter(t => t.status === 'in_progress').length,   color: '#1565c0' },
    { label: 'Terminées',  count: this.tasks().filter(t => t.status === 'completed').length,     color: '#2e7d32' },
  ];

  readonly form = this.fb.group({
    title:        ['', [Validators.required, Validators.minLength(2)]],
    description:  [''],
    assignedToId: ['', Validators.required],
    priority:     ['medium'],
    dueDate:      [''],
  });

  ngOnInit(): void {
    this.load();
    this.loadEmployees();
  }

  load(): void {
    this.loading.set(true);
    const params = new URLSearchParams({
      page: String(this.page),
      limit: String(this.pageSize),
    });
    if (this.filterStatus)   params.set('status',   this.filterStatus);
    if (this.filterPriority) params.set('priority', this.filterPriority);

    this.http.get<{ data: Task[]; total: number; totalPages: number }>(
      buildApiUrl(`/tasks?${params}`)
    ).subscribe({
      next: (res) => {
        this.tasks.set(res.data);
        this.filtered.set(res.data);
        this.total.set(res.total);
        this.totalPages.set(res.totalPages);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les tâches.');
        this.loading.set(false);
      },
    });
  }

  goToPage(p: number): void {
    if (p < 1 || p > this.totalPages()) return;
    this.page = p;
    this.load();
  }

  loadEmployees(): void {
    this.http.get<{ data: Employee[] }>(buildApiUrl('/admin/users?role=employee&limit=100')).subscribe({
      next: (res) => this.employees.set(res.data ?? []),
      error: () => {},
    });
  }

  applyFilter(): void {
    this.page = 1;
    this.load();
  }

  openCreate(): void {
    this.editingId.set(null);
    this.form.reset({ priority: 'medium' });
    this.formError.set(null);
    this.showForm.set(true);
  }

  editTask(task: Task): void {
    this.editingId.set(task.id);
    this.form.patchValue({
      title:        task.title,
      description:  task.description ?? '',
      assignedToId: task.assignedTo?.id ?? '',
      priority:     task.priority,
      dueDate:      task.dueDate ? task.dueDate.substring(0, 10) : '',
    });
    this.formError.set(null);
    this.showForm.set(true);
  }

  closeForm(): void {
    this.showForm.set(false);
  }

  submit(): void {
    if (this.form.invalid) return;
    this.saving.set(true);
    this.formError.set(null);

    const payload = this.form.value;
    const req = this.editingId()
      ? this.http.patch<Task>(buildApiUrl(`/tasks/${this.editingId()}`), payload)
      : this.http.post<Task>(buildApiUrl('/tasks'), payload);

    req.subscribe({
      next: (task) => {
        if (this.editingId()) {
          this.tasks.update(list => list.map(t => t.id === task.id ? task : t));
        } else {
          this.tasks.update(list => [task, ...list]);
        }
        this.applyFilter();
        this.saving.set(false);
        this.showForm.set(false);
      },
      error: () => {
        this.formError.set('Une erreur est survenue. Veuillez réessayer.');
        this.saving.set(false);
      },
    });
  }

  deleteTask(id: string): void {
    if (!confirm('Supprimer cette tâche ?')) return;
    this.http.delete(buildApiUrl(`/tasks/${id}`)).subscribe({
      next: () => {
        this.tasks.update(list => list.filter(t => t.id !== id));
        this.applyFilter();
      },
      error: () => this.error.set('Impossible de supprimer cette tâche.'),
    });
  }

  priorityLabel(p: string): string {
    const labels: Record<string, string> = {
      urgent: 'Urgente', high: 'Haute', medium: 'Moyenne', low: 'Basse',
    };
    return labels[p] ?? p;
  }
}
