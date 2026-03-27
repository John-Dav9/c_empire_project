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
interface TodoOrder {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  serviceTitle: string;
  address: string;
  scheduledAt: string;
  amount: number;
  currency: string;
  status: string;
  assignedEmployeeId?: string | null;
  instructions?: string;
  createdAt: string;
}

@Component({
  selector: 'app-todo-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, DecimalPipe, FormsModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <div>
          <h1>Commandes C'Todo</h1>
          <p>{{ orders().length }} commande{{ orders().length > 1 ? 's' : '' }}</p>
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
                <th>Client</th>
                <th>Service</th>
                <th>Planifié</th>
                <th>Montant</th>
                <th>Statut</th>
                <th>Assigné</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (o of orders(); track o.id) {
                <tr>
                  <td>
                    <div class="strong">{{ o.fullName }}</div>
                    <div class="muted">{{ o.email }}</div>
                  </td>
                  <td>{{ o.serviceTitle }}</td>
                  <td>{{ o.scheduledAt | date:'dd/MM/yyyy HH:mm' }}</td>
                  <td class="strong">{{ o.amount | number:'1.0-0' }} {{ o.currency }}</td>
                  <td>
                    <span class="badge" [class]="'st-' + o.status.toLowerCase()">{{ statusLabel(o.status) }}</span>
                  </td>
                  <td>
                    @if (o.assignedEmployeeId) {
                      <span class="assignee-chip">{{ employeeName(o.assignedEmployeeId) }}</span>
                    } @else {
                      <span class="muted">—</span>
                    }
                  </td>
                  <td class="actions">
                    <select
                      class="status-sel"
                      [value]="o.status"
                      (change)="updateStatus(o, $any($event.target).value)"
                      [attr.aria-label]="'Statut ' + o.id"
                    >
                      <option value="pending">En attente</option>
                      <option value="confirmed">Confirmée</option>
                      <option value="in_progress">En cours</option>
                      <option value="completed">Terminée</option>
                      <option value="cancelled">Annulée</option>
                    </select>
                    <button type="button" class="btn-assign" (click)="openAssign(o)" aria-label="Assigner employé">
                      <mat-icon>person_add</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr><td colspan="7" class="empty">Aucune commande.</td></tr>
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
              <h2>Assigner un bricoleur</h2>
              <button type="button" (click)="closeAssign()" aria-label="Fermer"><mat-icon>close</mat-icon></button>
            </div>
            <div class="modal-body">
              <p class="modal-sub">{{ assignTarget()!.fullName }} — {{ assignTarget()!.serviceTitle }}</p>
              <label class="modal-label" for="todo-assign-sel">Employé</label>
              <select id="todo-assign-sel" [(ngModel)]="selectedEmployeeId" class="status-sel wide">
                <option value="">— Désassigner —</option>
                @for (emp of bricoleurs(); track emp.id) {
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
    table { width:100%; border-collapse:collapse; min-width:860px; }
    th, td { text-align:left; padding:10px 12px; border-bottom:1px solid #eef2f8; vertical-align:middle; }
    th { font-size:.8rem; text-transform:uppercase; letter-spacing:.04em; color:#7a8fa5; background:#fafbfc; }
    .strong { font-weight:700; color:#1a2e40; }
    .muted   { font-size:.82rem; color:#8a9ab0; }
    .badge { border-radius:999px; padding:3px 9px; font-size:.75rem; font-weight:700; border:1px solid; }
    .st-pending    { background:#fff8e1; border-color:#ffe082; color:#7a5c00; }
    .st-confirmed  { background:#e8f5e9; border-color:#a5d6a7; color:#1b5e20; }
    .st-in_progress { background:#fff3e0; border-color:#ffcc80; color:#e65100; }
    .st-completed  { background:#e8f5e9; border-color:#66bb6a; color:#1b5e20; }
    .st-cancelled  { background:#f5f5f5; border-color:#bdbdbd; color:#616161; }
    .assignee-chip { background:#e3f2fd; color:#1565c0; border-radius:999px; padding:2px 8px; font-size:.75rem; font-weight:700; }
    .actions { display:flex; gap:6px; align-items:center; }
    .status-sel { border:1px solid #d0dde8; border-radius:8px; padding:5px 8px; font-size:.8rem; background:#fff; cursor:pointer; }
    .status-sel.wide { width:100%; }
    .btn-assign { background:none; border:1px solid #d0dde8; border-radius:8px; padding:4px; cursor:pointer; display:flex; align-items:center; color:#4a6078; }
    .btn-assign:hover { background:#f0f4f8; }
    .empty { text-align:center; color:#8a9ab0; padding:2rem !important; }
    .overlay { position:fixed; inset:0; background:rgba(0,0,0,.4); display:flex; align-items:center; justify-content:center; z-index:2000; padding:1rem; }
    .modal { background:#fff; border-radius:14px; width:100%; max-width:420px; overflow:hidden; }
    .modal-head { display:flex; justify-content:space-between; align-items:center; padding:14px 16px; border-bottom:1px solid #f0f0f0; }
    .modal-head h2 { margin:0; font-size:1.05rem; }
    .modal-head button { background:none; border:none; cursor:pointer; display:flex; align-items:center; color:#555; }
    .modal-body { padding:16px; display:grid; gap:10px; }
    .modal-sub { margin:0; font-size:.85rem; color:#60748d; }
    .modal-label { font-size:.8rem; font-weight:700; color:#4a6078; }
    .modal-foot { display:flex; justify-content:flex-end; gap:8px; padding:12px 16px; border-top:1px solid #f0f0f0; }
    .btn-cancel { background:#fff; border:1px solid #d0dde8; border-radius:8px; padding:7px 14px; cursor:pointer; font-weight:600; color:#4a6078; }
    .btn-save   { background:#c62828; border:none; border-radius:8px; padding:7px 16px; cursor:pointer; font-weight:700; color:#fff; }
    .btn-save:disabled { opacity:.5; cursor:not-allowed; }
  `],
})
export class TodoOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly orders    = signal<TodoOrder[]>([]);
  readonly employees = signal<Employee[]>([]);
  readonly loading   = signal(true);
  readonly error     = signal<string | null>(null);
  readonly notice    = signal<string | null>(null);
  readonly assigning = signal(false);
  readonly assignTarget = signal<TodoOrder | null>(null);
  selectedEmployeeId = '';

  readonly bricoleurs = () =>
    this.employees().filter((e) => !e.specialty || e.specialty === 'bricoleur' || e.specialty === 'coursier');

  ngOnInit(): void {
    this.load();
    this.loadEmployees();
  }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.api.get<TodoOrder[]>('/c-todo/orders').subscribe({
      next: (data) => { this.orders.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message ?? 'Erreur chargement'); this.loading.set(false); },
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

  statusLabel(s: string): string {
    const map: Record<string, string> = {
      pending: 'En attente', confirmed: 'Confirmée', in_progress: 'En cours',
      completed: 'Terminée', cancelled: 'Annulée',
    };
    return map[s] ?? s;
  }

  updateStatus(order: TodoOrder, status: string): void {
    this.error.set(null);
    this.api.patch(`/c-todo/orders/${order.id}/status`, { status }).subscribe({
      next: () => { this.notice.set('Statut mis à jour.'); this.load(); },
      error: (err) => this.error.set(err?.error?.message ?? 'Erreur mise à jour'),
    });
  }

  openAssign(order: TodoOrder): void {
    this.assignTarget.set(order);
    this.selectedEmployeeId = order.assignedEmployeeId ?? '';
    this.notice.set(null);
    this.error.set(null);
  }

  closeAssign(): void { this.assignTarget.set(null); }

  saveAssign(): void {
    const target = this.assignTarget();
    if (!target) return;
    this.assigning.set(true);
    this.api.patch(`/c-todo/orders/${target.id}/assign`, {
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
