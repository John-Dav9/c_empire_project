import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { buildApiUrl } from '../../../core/config/api.config';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { CurrencyXafPipe } from '../../../shared/pipes/currency-xaf.pipe';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';

type OrderType = 'shop' | 'grill' | 'clean' | 'todo' | 'event';
type FilterStatus = '' | 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

interface StatusOption { value: string; label: string; }

interface Order {
  id: string;
  type: OrderType;
  customerName: string;
  customerEmail: string;
  status: string;
  statusGroup: Exclude<FilterStatus, ''> | 'other';
  previousStatus: string;
  isUpdating?: boolean;
  totalAmount: number;
  createdAt: string;
  items?: unknown[];
  assignees?: Employee[];
}

interface Employee {
  id: string;
  firstname: string;
  lastname: string;
  specialty?: string;
}

@Component({
  selector: 'app-orders-tracking',
  imports: [
    FormsModule,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatusBadgeComponent,
    CurrencyXafPipe,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="orders-container">
      <app-page-header
        title="Suivi global des commandes"
        [subtitle]="allOrders().length + ' commandes au total'"
        [breadcrumbs]="[{ label: 'Super Admin', link: '/super-admin/dashboard' }, { label: 'Commandes' }]"
      >
        <button mat-stroked-button slot="actions" (click)="loadAllOrders()">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
      </app-page-header>

      <!-- Filtres -->
      <div class="filters-row">
        <select [(ngModel)]="filterType" (ngModelChange)="applyFilters()" class="filter-select" aria-label="Filtrer par service">
          <option value="">Tous les services</option>
          <option value="shop">C'Shop</option>
          <option value="grill">C'Grill</option>
          <option value="clean">C'Clean</option>
          <option value="todo">C'Todo</option>
          <option value="event">C'Events</option>
        </select>
        <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilters()" class="filter-select" aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          <option value="pending">En attente</option>
          <option value="confirmed">Confirmée</option>
          <option value="processing">En cours</option>
          <option value="completed">Terminée</option>
          <option value="cancelled">Annulée</option>
        </select>
      </div>

      <!-- KPIs -->
      <div class="stats-row">
        <div class="stat-pill">
          <span class="stat-num">{{ allOrders().length }}</span>
          <span class="stat-lbl">Total</span>
        </div>
        <div class="stat-pill stat-pill--orange">
          <span class="stat-num">{{ countByStatus('pending') }}</span>
          <span class="stat-lbl">En attente</span>
        </div>
        <div class="stat-pill stat-pill--blue">
          <span class="stat-num">{{ countByStatus('processing') }}</span>
          <span class="stat-lbl">En cours</span>
        </div>
        <div class="stat-pill stat-pill--green">
          <span class="stat-num">{{ countByStatus('completed') }}</span>
          <span class="stat-lbl">Terminées</span>
        </div>
        <div class="stat-pill stat-pill--red">
          <span class="stat-num">{{ countByStatus('cancelled') }}</span>
          <span class="stat-lbl">Annulées</span>
        </div>
      </div>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="40" />
          <p>Chargement des commandes...</p>
        </div>
      }

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }
      @if (notice()) {
        <div class="alert alert-success" role="status">{{ notice() }}</div>
      }

      @if (!loading()) {
        <div class="table-wrapper">
          <table class="orders-table" aria-label="Liste des commandes">
            <thead>
              <tr>
                <th scope="col">Service</th>
                <th scope="col">N° Commande</th>
                <th scope="col">Client</th>
                <th scope="col">Date</th>
                <th scope="col">Montant</th>
                <th scope="col">Statut</th>
                <th scope="col">Assignés</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of filteredOrders(); track order.id) {
                <tr>
                  <td>
                    <span class="type-badge" [class]="'type-' + order.type">
                      {{ getTypeLabel(order.type) }}
                    </span>
                  </td>
                  <td class="order-id">#{{ order.id.substring(0, 8) }}</td>
                  <td>
                    <p class="customer-name">{{ order.customerName }}</p>
                    <p class="customer-email">{{ order.customerEmail }}</p>
                  </td>
                  <td>{{ order.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                  <td class="amount">{{ order.totalAmount | currencyXaf }}</td>
                  <td>
                    <select
                      [(ngModel)]="order.status"
                      (ngModelChange)="updateOrderStatus(order)"
                      [disabled]="!!order.isUpdating"
                      class="status-select"
                      [attr.aria-label]="'Statut commande ' + order.id.substring(0,8)"
                    >
                      @for (opt of getStatusOptions(order.type); track opt.value) {
                        <option [value]="opt.value">{{ opt.label }}</option>
                      }
                    </select>
                  </td>
                  <td class="assignees-cell">
                    @for (emp of (order.assignees ?? []); track emp.id) {
                      <span class="assignee-chip">{{ emp.firstname }} {{ emp.lastname }}</span>
                    }
                    @if (!(order.assignees?.length)) {
                      <span class="no-assignee">—</span>
                    }
                  </td>
                  <td class="actions-cell">
                    <button mat-icon-button (click)="openDetail(order)" title="Voir les détails" aria-label="Voir les détails">
                      <mat-icon>visibility</mat-icon>
                    </button>
                    <button mat-icon-button (click)="openAssignModal(order)" title="Assigner des employés" aria-label="Assigner des employés">
                      <mat-icon>person_add</mat-icon>
                    </button>
                    <button mat-icon-button (click)="printInvoice(order)" [disabled]="order.type !== 'shop'" title="Facture PDF (C'Shop uniquement)" aria-label="Imprimer la facture">
                      <mat-icon>print</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-cell">
                    <mat-icon>inventory_2</mat-icon>
                    <p>Aucune commande trouvée</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Modale assignation employés -->
      @if (assignOrder()) {
        <div class="modal-overlay" (click)="closeAssignModal()" role="dialog" aria-modal="true" aria-label="Assigner des employés">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Assigner des employés</h2>
              <button mat-icon-button (click)="closeAssignModal()" aria-label="Fermer"><mat-icon>close</mat-icon></button>
            </div>
            <div class="modal-body">
              <p class="assign-order-ref">Commande #{{ assignOrder()!.id.substring(0, 8) }} — {{ getTypeLabel(assignOrder()!.type) }}</p>

              <!-- Employés actuellement assignés -->
              <p class="assign-section-label">Assignés actuellement</p>
              @if (!(assignOrder()!.assignees?.length)) {
                <p class="assign-empty">Aucun employé assigné.</p>
              }
              @for (emp of (assignOrder()!.assignees ?? []); track emp.id) {
                <div class="assign-chip-row">
                  <span class="assignee-chip">{{ emp.firstname }} {{ emp.lastname }}</span>
                  @if (emp.specialty) { <span class="specialty-label">{{ emp.specialty }}</span> }
                  <button mat-icon-button (click)="removeAssignee(assignOrder()!, emp.id)" aria-label="Retirer" title="Retirer">
                    <mat-icon>remove_circle_outline</mat-icon>
                  </button>
                </div>
              }

              <!-- Ajouter un employé -->
              <p class="assign-section-label" style="margin-top:1rem">Ajouter un employé</p>
              <div class="assign-add-row">
                <select [(ngModel)]="selectedAssigneeId" class="status-select" aria-label="Choisir un employé">
                  <option value="">Sélectionner un employé...</option>
                  @for (emp of unassignedEmployees(assignOrder()!); track emp.id) {
                    <option [value]="emp.id">{{ emp.firstname }} {{ emp.lastname }}{{ emp.specialty ? ' — ' + emp.specialty : '' }}</option>
                  }
                </select>
                <button mat-flat-button [disabled]="!selectedAssigneeId || assigning" (click)="addAssignee()">
                  <mat-icon>add</mat-icon> Ajouter
                </button>
              </div>
            </div>
            <div class="modal-footer">
              <button mat-stroked-button (click)="closeAssignModal()">Fermer</button>
            </div>
          </div>
        </div>
      }

      <!-- Modale détails -->
      @if (selectedOrder()) {
        <div class="modal-overlay" (click)="selectedOrder.set(null)" role="dialog" aria-modal="true" aria-label="Détails de la commande">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>Détails de la commande</h2>
              <button mat-icon-button (click)="selectedOrder.set(null)" aria-label="Fermer">
                <mat-icon>close</mat-icon>
              </button>
            </div>
            <div class="modal-body">
              <div class="detail-row">
                <span class="lbl">Service</span>
                <span class="type-badge" [class]="'type-' + selectedOrder()!.type">{{ getTypeLabel(selectedOrder()!.type) }}</span>
              </div>
              <div class="detail-row">
                <span class="lbl">N° Commande</span>
                <span class="mono">#{{ selectedOrder()!.id }}</span>
              </div>
              <div class="detail-row">
                <span class="lbl">Date</span>
                <span>{{ selectedOrder()!.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-row">
                <span class="lbl">Statut</span>
                <app-status-badge [status]="selectedOrder()!.status" />
              </div>
              <div class="detail-row">
                <span class="lbl">Client</span>
                <span>{{ selectedOrder()!.customerName }}</span>
              </div>
              <div class="detail-row">
                <span class="lbl">Email</span>
                <span>{{ selectedOrder()!.customerEmail }}</span>
              </div>
              <div class="detail-row detail-row--total">
                <span class="lbl">Total</span>
                <span class="total-amount">{{ selectedOrder()!.totalAmount | currencyXaf }}</span>
              </div>
            </div>
            <div class="modal-footer">
              <button mat-stroked-button (click)="selectedOrder.set(null)">Fermer</button>
              <button mat-flat-button class="print-btn" (click)="printInvoice(selectedOrder()!)" [disabled]="selectedOrder()!.type !== 'shop'">
                <mat-icon>print</mat-icon>
                Imprimer facture
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .orders-container { padding: 2rem; max-width: 1600px; margin: 0 auto; }

    .filters-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .filter-select {
      padding: 0.5rem 1rem;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
      font-size: 0.875rem;
      background: white;
      min-width: 180px;
      cursor: pointer;
    }
    .filter-select:focus { outline: none; border-color: #c62828; }

    .stats-row {
      display: flex;
      gap: 1rem;
      margin-bottom: 1.5rem;
      flex-wrap: wrap;
    }
    .stat-pill {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 0.75rem 1.5rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.06);
      min-width: 90px;
    }
    .stat-num { font-size: 1.5rem; font-weight: 800; color: #1a1a2e; }
    .stat-lbl { font-size: 0.7rem; font-weight: 500; color: #aaa; text-transform: uppercase; letter-spacing: 0.05em; }
    .stat-pill--orange .stat-num { color: #e65100; }
    .stat-pill--blue   .stat-num { color: #1565c0; }
    .stat-pill--green  .stat-num { color: #2e7d32; }
    .stat-pill--red    .stat-num { color: #c62828; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      color: #888;
    }

    .alert {
      padding: 0.875rem 1.25rem;
      border-radius: 8px;
      margin-bottom: 1rem;
      font-size: 0.875rem;
    }
    .alert-error   { background: #fce4ec; color: #c62828; }
    .alert-success { background: #e8f5e9; color: #2e7d32; }

    .table-wrapper {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      overflow-x: auto;
    }
    .orders-table {
      width: 100%;
      border-collapse: collapse;
    }
    .orders-table thead th {
      padding: 1rem;
      text-align: left;
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
      background: #fafafa;
      border-bottom: 1px solid #f0f0f0;
      white-space: nowrap;
    }
    .orders-table tbody tr { border-bottom: 1px solid #f5f5f5; transition: background 0.15s; }
    .orders-table tbody tr:hover { background: #fafafa; }
    .orders-table tbody td { padding: 0.875rem 1rem; font-size: 0.875rem; color: #333; vertical-align: middle; }

    .order-id { font-family: monospace; font-weight: 600; color: #999; }
    .customer-name { font-weight: 600; color: #1a1a2e; margin: 0 0 0.1rem; }
    .customer-email { font-size: 0.72rem; color: #aaa; margin: 0; }
    .amount { font-weight: 700; color: #1a1a2e; white-space: nowrap; }
    .actions-cell { display: flex; gap: 0.25rem; align-items: center; }

    .empty-cell {
      text-align: center;
      padding: 3rem !important;
      color: #aaa;
    }
    .empty-cell mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; display: block; margin: 0 auto 0.5rem; }
    .empty-cell p { margin: 0; }

    .type-badge {
      display: inline-block;
      padding: 0.2rem 0.65rem;
      border-radius: 100px;
      font-size: 0.72rem;
      font-weight: 700;
      white-space: nowrap;
    }
    .type-shop  { background: #e3f2fd; color: #1565c0; }
    .type-grill { background: #fff3e0; color: #e65100; }
    .type-clean { background: #e8f5e9; color: #2e7d32; }
    .type-todo  { background: #fce4ec; color: #c62828; }
    .type-event { background: #f3e5f5; color: #6a1b9a; }

    .status-select {
      padding: 0.3rem 0.5rem;
      border: 1px solid #e0e0e0;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      min-width: 130px;
      background: white;
    }
    .status-select:focus { outline: none; border-color: #c62828; }
    .status-select:disabled { opacity: 0.5; cursor: not-allowed; }

    /* Modale */
    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0,0,0,0.45);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
      padding: 1rem;
    }
    .modal {
      background: white;
      border-radius: 16px;
      width: 100%;
      max-width: 520px;
      max-height: 90vh;
      overflow-y: auto;
    }
    .modal-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 1.25rem 1.5rem;
      border-bottom: 1px solid #f0f0f0;
    }
    .modal-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
    .modal-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 0.875rem; }
    .detail-row { display: flex; justify-content: space-between; align-items: center; gap: 1rem; }
    .detail-row--total {
      border-top: 1px solid #f0f0f0;
      padding-top: 0.875rem;
      margin-top: 0.25rem;
    }
    .lbl { font-size: 0.8rem; font-weight: 600; color: #888; }
    .mono { font-family: monospace; font-size: 0.85rem; color: #555; }
    .total-amount { font-size: 1.1rem; font-weight: 800; color: #1a1a2e; }
    .modal-footer {
      display: flex;
      justify-content: flex-end;
      gap: 0.75rem;
      padding: 1rem 1.5rem;
      border-top: 1px solid #f0f0f0;
    }
    .print-btn { background-color: #c62828; color: white; }

    /* Assign modal */
    .assignees-cell { display: flex; flex-wrap: wrap; gap: 0.25rem; align-items: center; }
    .assignee-chip {
      display: inline-block;
      padding: 0.15rem 0.5rem;
      border-radius: 100px;
      font-size: 0.7rem;
      font-weight: 700;
      background: #e3f2fd;
      color: #1565c0;
      white-space: nowrap;
    }
    .no-assignee { color: #ccc; font-size: 0.8rem; }
    .assign-order-ref { font-size: 0.85rem; color: #888; margin: 0; }
    .assign-section-label {
      font-size: 0.75rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: #888;
      margin: 0 0 0.5rem;
    }
    .assign-empty { color: #aaa; font-size: 0.85rem; font-style: italic; margin: 0; }
    .assign-chip-row { display: flex; align-items: center; gap: 0.5rem; margin-bottom: 0.4rem; }
    .specialty-label { font-size: 0.72rem; color: #888; font-style: italic; }
    .assign-add-row { display: flex; gap: 0.75rem; align-items: center; flex-wrap: wrap; }
    .assign-add-row .status-select { flex: 1; min-width: 180px; }
  `]
})
export class OrdersTrackingComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly allOrders = signal<Order[]>([]);
  readonly filteredOrders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly selectedOrder = signal<Order | null>(null);

  // Assign modal state
  readonly assignOrder = signal<Order | null>(null);
  readonly employees = signal<Employee[]>([]);
  selectedAssigneeId = '';
  assigning = false;

  filterType = '';
  filterStatus: FilterStatus = '';

  private readonly statusOptions: Record<OrderType, StatusOption[]> = {
    shop: [
      { value: 'pending',   label: 'En attente' },
      { value: 'confirmed', label: 'Confirmée' },
      { value: 'paid',      label: 'Payée' },
      { value: 'preparing', label: 'Préparation' },
      { value: 'shipped',   label: 'Expédiée' },
      { value: 'delivered', label: 'Livrée' },
      { value: 'cancelled', label: 'Annulée' },
      { value: 'refunded',  label: 'Remboursée' },
    ],
    grill: [
      { value: 'PENDING',          label: 'En attente' },
      { value: 'PAID',             label: 'Payée' },
      { value: 'CONFIRMED',        label: 'Confirmée' },
      { value: 'PREPARING',        label: 'Préparation' },
      { value: 'READY',            label: 'Prête' },
      { value: 'OUT_FOR_DELIVERY', label: 'En livraison' },
      { value: 'DELIVERED',        label: 'Livrée' },
      { value: 'CANCELLED',        label: 'Annulée' },
      { value: 'REFUSED',          label: 'Refusée' },
    ],
    clean: [
      { value: 'DRAFT',            label: 'Brouillon' },
      { value: 'PAYMENT_PENDING',  label: 'Paiement en attente' },
      { value: 'CONFIRMED',        label: 'Confirmée' },
      { value: 'ASSIGNED',         label: 'Assignée' },
      { value: 'IN_PROGRESS',      label: 'En cours' },
      { value: 'DONE',             label: 'Terminée' },
      { value: 'CANCELLED',        label: 'Annulée' },
      { value: 'FAILED',           label: 'Échec' },
    ],
    todo: [
      { value: 'pending',     label: 'En attente' },
      { value: 'confirmed',   label: 'Confirmée' },
      { value: 'in_progress', label: 'En cours' },
      { value: 'completed',   label: 'Terminée' },
      { value: 'cancelled',   label: 'Annulée' },
    ],
    event: [
      { value: 'PENDING',    label: 'En attente' },
      { value: 'VALIDATED',  label: 'Validée' },
      { value: 'PAID',       label: 'Payée' },
      { value: 'REFUSED',    label: 'Refusée' },
      { value: 'CANCELLED',  label: 'Annulée' },
    ],
  };

  ngOnInit(): void {
    this.loadAllOrders();
    this.loadEmployees();
  }

  private loadEmployees(): void {
    this.http.get<any>(buildApiUrl('/admin/users?role=employee&limit=200')).subscribe({
      next: (res) => {
        this.employees.set(
          (res.data ?? res ?? []).map((u: any) => ({
            id: u.id,
            firstname: u.firstname,
            lastname: u.lastname,
            specialty: u.specialty,
          }))
        );
      },
      error: () => {},
    });
  }

  openAssignModal(order: Order): void {
    this.selectedAssigneeId = '';
    this.assignOrder.set(order);
  }

  closeAssignModal(): void {
    this.assignOrder.set(null);
    this.selectedAssigneeId = '';
    this.assigning = false;
  }

  addAssignee(): void {
    const order = this.assignOrder();
    if (!order || !this.selectedAssigneeId) return;
    this.assigning = true;
    this.http.post(buildApiUrl(`/cshop/orders/${order.id}/assignees/${this.selectedAssigneeId}`), {}).subscribe({
      next: () => {
        const emp = this.employees().find(e => e.id === this.selectedAssigneeId);
        if (emp) {
          if (!order.assignees) order.assignees = [];
          if (!order.assignees.some(e => e.id === emp.id)) {
            order.assignees = [...order.assignees, emp];
          }
        }
        this.selectedAssigneeId = '';
        this.assigning = false;
        this.allOrders.update(o => [...o]);
        this.applyFilters();
      },
      error: () => {
        this.error.set("Erreur lors de l'assignation.");
        this.assigning = false;
      },
    });
  }

  removeAssignee(order: Order, employeeId: string): void {
    this.http.delete(buildApiUrl(`/cshop/orders/${order.id}/assignees/${employeeId}`)).subscribe({
      next: () => {
        order.assignees = (order.assignees ?? []).filter(e => e.id !== employeeId);
        this.allOrders.update(o => [...o]);
        this.applyFilters();
      },
      error: () => this.error.set('Erreur lors du retrait.'),
    });
  }

  unassignedEmployees(order: Order): Employee[] {
    const assignedIds = new Set((order.assignees ?? []).map(e => e.id));
    return this.employees().filter(e => !assignedIds.has(e.id));
  }

  loadAllOrders(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notice.set(null);

    forkJoin({
      shopOrders:    this.http.get<unknown[]>(buildApiUrl('/cshop/orders')).pipe(catchError(() => of([]))),
      grillOrders:   this.http.get<unknown[]>(buildApiUrl('/grill/orders/admin/all')).pipe(catchError(() => of([]))),
      cleanBookings: this.http.get<unknown[]>(buildApiUrl('/cclean/bookings')).pipe(catchError(() => of([]))),
      todoOrders:    this.http.get<unknown[]>(buildApiUrl('/c-todo/orders')).pipe(catchError(() => of([]))),
      eventBookings: this.http.get<unknown[]>(buildApiUrl('/c-event/bookings')).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        const all: Order[] = [
          ...this.mapOrders(data.shopOrders,    'shop'),
          ...this.mapOrders(data.grillOrders,   'grill'),
          ...this.mapOrders(data.cleanBookings, 'clean'),
          ...this.mapOrders(data.todoOrders,    'todo'),
          ...this.mapOrders(data.eventBookings, 'event'),
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

        this.allOrders.set(all);
        this.filteredOrders.set(all);
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Erreur lors du chargement des commandes.');
        this.loading.set(false);
      },
    });
  }

  applyFilters(): void {
    this.filteredOrders.set(
      this.allOrders().filter((o) => {
        const typeOk   = !this.filterType   || o.type        === this.filterType;
        const statusOk = !this.filterStatus || o.statusGroup === this.filterStatus;
        return typeOk && statusOk;
      })
    );
  }

  countByStatus(status: Exclude<FilterStatus, ''>): number {
    return this.allOrders().filter((o) => o.statusGroup === status).length;
  }

  updateOrderStatus(order: Order): void {
    const previous = order.previousStatus;
    order.isUpdating = true;
    this.notice.set(null);
    this.error.set(null);

    this.getUpdateRequest(order).subscribe({
      next: () => {
        order.previousStatus = order.status;
        order.statusGroup    = this.toStatusGroup(order.status);
        this.notice.set(`Statut de la commande #${order.id.slice(0, 8)} mis à jour.`);
        this.applyFilters();
      },
      error: (err: { error?: { message?: string }; message?: string }) => {
        order.status      = previous;
        order.statusGroup = this.toStatusGroup(previous);
        this.error.set(
          err?.error?.message ?? err?.message ?? 'Impossible de mettre à jour le statut.'
        );
      },
      complete: () => { order.isUpdating = false; },
    });
  }

  openDetail(order: Order): void {
    this.selectedOrder.set(order);
  }

  printInvoice(order: Order): void {
    if (order.type !== 'shop') {
      this.error.set("La facture PDF est disponible uniquement pour les commandes C'Shop.");
      return;
    }
    window.open(buildApiUrl(`/cshop/orders/${order.id}/invoice`), '_blank', 'noopener');
  }

  getTypeLabel(type: OrderType): string {
    const labels: Record<OrderType, string> = {
      shop: "C'Shop", grill: "C'Grill", clean: "C'Clean", todo: "C'Todo", event: "C'Events",
    };
    return labels[type] ?? type;
  }

  getStatusOptions(type: OrderType): StatusOption[] {
    return this.statusOptions[type] ?? [];
  }

  private mapOrders(raw: unknown[], type: OrderType): Order[] {
    if (!Array.isArray(raw)) return [];
    return raw.map((o: any) => ({
      id: o.id,
      type,
      customerName:  o.user?.firstname ? `${o.user.firstname} ${o.user.lastname ?? ''}` : (o.customerName ?? 'Client'),
      customerEmail: o.user?.email ?? o.customerEmail ?? 'N/A',
      status:        this.normalizeIncomingStatus(type, o.status),
      statusGroup:   this.toStatusGroup(o.status),
      previousStatus: this.normalizeIncomingStatus(type, o.status),
      totalAmount:   o.totalAmount ?? o.total ?? o.price ?? 0,
      createdAt:     o.createdAt ?? new Date().toISOString(),
      items:         o.items ?? o.orderItems ?? [],
      assignees: Array.isArray(o.assignees) ? o.assignees.map((e: any) => ({ id: e.id, firstname: e.firstname, lastname: e.lastname, specialty: e.specialty })) : [],
    }));
  }

  private getUpdateRequest(order: Order): Observable<void> {
    switch (order.type) {
      case 'shop':
        return this.http.patch(buildApiUrl(`/cshop/orders/${order.id}/status`), { status: order.status }).pipe(map(() => void 0));
      case 'grill':
        return this.http.patch(buildApiUrl(`/grill/orders/admin/${order.id}/status`), { status: order.status }).pipe(map(() => void 0));
      case 'clean':
        return this.http.patch(buildApiUrl(`/cclean/bookings/${order.id}/status`), { status: order.status }).pipe(map(() => void 0));
      case 'todo':
        return this.http.patch(buildApiUrl(`/c-todo/orders/${order.id}/status`), { status: order.status }).pipe(map(() => void 0));
      case 'event':
        if (order.status === 'VALIDATED')
          return this.http.patch(buildApiUrl(`/c-event/bookings/${order.id}/validate`), {}).pipe(map(() => void 0));
        if (order.status === 'REFUSED')
          return this.http.patch(buildApiUrl(`/c-event/bookings/${order.id}/refuse`), {}).pipe(map(() => void 0));
        return throwError(() => new Error("Seuls VALIDATED et REFUSED sont modifiables pour C'Events."));
      default:
        return of(void 0);
    }
  }

  private normalizeIncomingStatus(type: OrderType, status: unknown): string {
    const options = this.getStatusOptions(type);
    if (typeof status === 'string') {
      const found = options.find((o) => o.value === status);
      if (found) return found.value;
    }
    return options[0]?.value ?? String(status ?? 'pending');
  }

  private toStatusGroup(status: unknown): Order['statusGroup'] {
    const s = String(status ?? '').toLowerCase();
    if (['pending', 'draft', 'payment_pending'].includes(s))                                                              return 'pending';
    if (['confirmed', 'paid', 'validated'].includes(s))                                                                   return 'confirmed';
    if (['processing', 'preparing', 'in_progress', 'assigned', 'ready', 'out_for_delivery', 'shipped'].includes(s))      return 'processing';
    if (['completed', 'done', 'delivered'].includes(s))                                                                   return 'completed';
    if (['cancelled', 'failed', 'refused', 'refunded'].includes(s))                                                       return 'cancelled';
    return 'other';
  }
}
