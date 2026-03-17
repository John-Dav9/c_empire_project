import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Observable, forkJoin, of, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { buildApiUrl } from '../../../core/config/api.config';

type OrderType = 'shop' | 'grill' | 'clean' | 'todo' | 'event';
type FilterStatus = '' | 'pending' | 'confirmed' | 'processing' | 'completed' | 'cancelled';

interface StatusOption {
  value: string;
  label: string;
}

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
  items?: any[];
}

@Component({
  selector: 'app-orders-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="orders-container">
      <div class="header">
        <h1>📦 Suivi Global des Commandes</h1>
        <div class="filters">
          <select [(ngModel)]="filterType" (change)="applyFilters()" class="form-control">
            <option value="">Tous les services</option>
            <option value="shop">🛍️ C'Shop</option>
            <option value="grill">🍔 C'Grill</option>
            <option value="clean">🧹 C'Clean</option>
            <option value="todo">📋 C'Todo</option>
            <option value="event">🎉 C'Events</option>
          </select>
          <select [(ngModel)]="filterStatus" (change)="applyFilters()" class="form-control">
            <option value="">Tous les statuts</option>
            <option value="pending">En attente</option>
            <option value="confirmed">Confirmée</option>
            <option value="processing">En cours</option>
            <option value="completed">Complétée</option>
            <option value="cancelled">Annulée</option>
          </select>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">📦</div>
          <div class="stat-content">
            <div class="stat-value">{{ allOrders.length }}</div>
            <div class="stat-label">Total Commandes</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⏳</div>
          <div class="stat-content">
            <div class="stat-value">{{ getOrdersByStatus('pending').length }}</div>
            <div class="stat-label">En Attente</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">⚙️</div>
          <div class="stat-content">
            <div class="stat-value">{{ getOrdersByStatus('processing').length }}</div>
            <div class="stat-label">En Cours</div>
          </div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✅</div>
          <div class="stat-content">
            <div class="stat-value">{{ getOrdersByStatus('completed').length }}</div>
            <div class="stat-label">Complétées</div>
          </div>
        </div>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement des commandes...</p>
      </div>

      <div *ngIf="error" class="alert alert-error">{{ error }}</div>
      <div *ngIf="notice" class="alert alert-success">{{ notice }}</div>
      <div class="alert alert-info" *ngIf="!loading">
        Vue globale active pour C'Shop, C'Grill, C'Clean, C'Todo et C'Events.
        C'Express reste pilote depuis ses ecrans logistiques dedies.
      </div>

      <!-- Orders Table -->
      <div *ngIf="!loading" class="table-container">
        <table class="orders-table">
          <thead>
            <tr>
              <th>Type</th>
              <th>N° Commande</th>
              <th>Client</th>
              <th>Date</th>
              <th>Montant</th>
              <th>Statut</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let order of filteredOrders">
              <td>
                <span class="type-badge" [class]="'type-' + order.type">
                  {{ getTypeIcon(order.type) }} {{ getTypeLabel(order.type) }}
                </span>
              </td>
              <td class="order-id">#{{ order.id.substring(0, 8) }}</td>
              <td>
                <div class="customer-info">
                  <div class="customer-name">{{ order.customerName }}</div>
                  <div class="customer-email">{{ order.customerEmail }}</div>
                </div>
              </td>
              <td>{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</td>
              <td class="amount">{{ order.totalAmount | number:'1.0-0' }} FCFA</td>
              <td>
                <select [(ngModel)]="order.status"
                        (change)="updateOrderStatus(order)"
                        [disabled]="!!order.isUpdating"
                        class="status-select"
                        [class]="'status-' + order.statusGroup">
                  <option
                    *ngFor="let option of getStatusOptions(order.type)"
                    [value]="option.value"
                  >
                    {{ option.label }}
                  </option>
                </select>
              </td>
              <td class="actions">
                <button class="btn-icon" (click)="viewOrderDetails(order)" title="Voir détails">👁️</button>
                <button class="btn-icon" (click)="printInvoice(order)" [disabled]="order.type !== 'shop'" title="Imprimer facture C'Shop">🖨️</button>
              </td>
            </tr>
          </tbody>
        </table>

        <div *ngIf="filteredOrders.length === 0" class="empty-state">
          <p>📦 Aucune commande trouvée</p>
        </div>
      </div>

      <!-- Order Details Modal -->
      <div *ngIf="selectedOrder" class="modal-overlay" (click)="selectedOrder = null">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>📦 Détails de la Commande</h2>
            <button class="close-btn" (click)="selectedOrder = null">✕</button>
          </div>
          <div class="modal-body">
            <div class="detail-section">
              <h3>Informations Générales</h3>
              <div class="detail-row">
                <span class="label">Type:</span>
                <span class="type-badge" [class]="'type-' + selectedOrder.type">
                  {{ getTypeIcon(selectedOrder.type) }} {{ getTypeLabel(selectedOrder.type) }}
                </span>
              </div>
              <div class="detail-row">
                <span class="label">N° Commande:</span>
                <span>#{{ selectedOrder.id }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Date:</span>
                <span>{{ selectedOrder.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Statut:</span>
                <span class="badge" [class]="'status-' + selectedOrder.status">
                  {{ getStatusLabel(selectedOrder.status) }}
                </span>
              </div>
            </div>
            <div class="detail-section">
              <h3>Client</h3>
              <div class="detail-row">
                <span class="label">Nom:</span>
                <span>{{ selectedOrder.customerName }}</span>
              </div>
              <div class="detail-row">
                <span class="label">Email:</span>
                <span>{{ selectedOrder.customerEmail }}</span>
              </div>
            </div>
            <div class="detail-section">
              <h3>Montant</h3>
              <div class="detail-row total">
                <span class="label">Total:</span>
                <span class="amount">{{ selectedOrder.totalAmount | number:'1.0-0' }} FCFA</span>
              </div>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-secondary" (click)="selectedOrder = null">Fermer</button>
            <button class="btn btn-primary" (click)="printInvoice(selectedOrder)">🖨️ Imprimer</button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .orders-container {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      flex-wrap: wrap;
      gap: 1rem;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }

      .filters {
        display: flex;
        gap: 1rem;

        .form-control {
          padding: 0.5rem 1rem;
          border: 1px solid #ddd;
          border-radius: 8px;
          font-size: 0.875rem;
          min-width: 180px;

          &:focus {
            outline: none;
            border-color: #dc3545;
          }
        }
      }
    }

    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1.5rem;
      margin-bottom: 2rem;

      .stat-card {
        background: white;
        border-radius: 12px;
        padding: 1.5rem;
        box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
        display: flex;
        align-items: center;
        gap: 1rem;

        .stat-icon {
          font-size: 2.5rem;
        }

        .stat-content {
          .stat-value {
            font-size: 2rem;
            font-weight: 700;
            color: #dc3545;
            line-height: 1;
            margin-bottom: 0.25rem;
          }

          .stat-label {
            color: #666;
            font-size: 0.875rem;
          }
        }
      }
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;

      .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #dc3545;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
    }

    .alert {
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;

      &.alert-error {
        background: #f8d7da;
        color: #721c24;
      }

      &.alert-success {
        background: #d4edda;
        color: #155724;
      }

      &.alert-info {
        background: #edf5ff;
        color: #245b93;
      }
    }

    .table-container {
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      overflow: hidden;
    }

    .orders-table {
      width: 100%;
      border-collapse: collapse;

      thead {
        background: #f8f9fa;

        th {
          padding: 1rem;
          text-align: left;
          font-weight: 600;
          color: #1a1a1a;
          border-bottom: 2px solid #dee2e6;
          white-space: nowrap;
        }
      }

      tbody {
        tr {
          border-bottom: 1px solid #dee2e6;
          transition: background 0.2s;

          &:hover {
            background: #f8f9fa;
          }
        }

        td {
          padding: 1rem;
          color: #333;

          &.order-id {
            font-family: monospace;
            font-weight: 600;
            color: #666;
          }

          &.amount {
            font-weight: 700;
            color: #dc3545;
            white-space: nowrap;
          }

          &.actions {
            display: flex;
            gap: 0.5rem;
          }
        }
      }
    }

    .type-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      white-space: nowrap;

      &.type-shop { background: #e7f5ff; color: #1971c2; }
      &.type-grill { background: #fff3bf; color: #e67700; }
      &.type-clean { background: #d3f9d8; color: #2f9e44; }
      &.type-todo { background: #ffe3e3; color: #c92a2a; }
      &.type-event { background: #ffe8cc; color: #d9480f; }
    }

    .customer-info {
      .customer-name {
        font-weight: 600;
        margin-bottom: 0.125rem;
      }

      .customer-email {
        font-size: 0.75rem;
        color: #666;
      }
    }

    .status-select {
      padding: 0.375rem 0.5rem;
      border: 1px solid #ddd;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      min-width: 130px;

      &.status-pending { background: #fff3cd; color: #856404; }
      &.status-confirmed { background: #d1ecf1; color: #0c5460; }
      &.status-processing { background: #d3d3f5; color: #383d91; }
      &.status-completed { background: #d4edda; color: #155724; }
      &.status-cancelled { background: #f8d7da; color: #721c24; }

      &:focus {
        outline: none;
        border-color: #dc3545;
      }
    }

    .btn-icon {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.2);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
        transform: none;
      }
    }

    .modal-overlay {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;

        h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;

          &:hover {
            color: #333;
          }
        }
      }

      .modal-body {
        padding: 1.5rem;

        .detail-section {
          margin-bottom: 1.5rem;
          padding-bottom: 1.5rem;
          border-bottom: 1px solid #eee;

          &:last-child {
            border-bottom: none;
          }

          h3 {
            margin: 0 0 1rem;
            font-size: 1.125rem;
            font-weight: 600;
            color: #1a1a1a;
          }

          .detail-row {
            display: flex;
            justify-content: space-between;
            padding: 0.5rem 0;

            &.total {
              font-size: 1.25rem;
              font-weight: 700;
              padding-top: 1rem;
              border-top: 2px solid #dee2e6;
            }

            .label {
              font-weight: 600;
              color: #666;
            }

            .amount {
              color: #dc3545;
            }
          }
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding: 1.5rem;
        border-top: 1px solid #eee;

        .btn {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: 8px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s;

          &.btn-primary {
            background: #dc3545;
            color: white;

            &:hover {
              background: #c82333;
            }
          }

          &.btn-secondary {
            background: #6c757d;
            color: white;

            &:hover {
              background: #5a6268;
            }
          }
        }
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class OrdersTrackingComponent implements OnInit {
  private http = inject(HttpClient);
  private readonly statusOptions: Record<OrderType, StatusOption[]> = {
    shop: [
      { value: 'pending', label: '⏳ En attente' },
      { value: 'confirmed', label: '✓ Confirmée' },
      { value: 'paid', label: '💳 Payée' },
      { value: 'preparing', label: '👨‍🍳 Préparation' },
      { value: 'shipped', label: '🚚 Expédiée' },
      { value: 'delivered', label: '✅ Livrée' },
      { value: 'cancelled', label: '❌ Annulée' },
      { value: 'refunded', label: '↩️ Remboursée' },
    ],
    grill: [
      { value: 'PENDING', label: '⏳ En attente' },
      { value: 'PAID', label: '💳 Payée' },
      { value: 'CONFIRMED', label: '✓ Confirmée' },
      { value: 'PREPARING', label: '👨‍🍳 Préparation' },
      { value: 'READY', label: '📦 Prête' },
      { value: 'OUT_FOR_DELIVERY', label: '🚚 En livraison' },
      { value: 'DELIVERED', label: '✅ Livrée' },
      { value: 'CANCELLED', label: '❌ Annulée' },
      { value: 'REFUSED', label: '⛔ Refusée' },
    ],
    clean: [
      { value: 'DRAFT', label: '📝 Brouillon' },
      { value: 'PAYMENT_PENDING', label: '💳 Paiement en attente' },
      { value: 'CONFIRMED', label: '✓ Confirmée' },
      { value: 'ASSIGNED', label: '🧑‍🔧 Assignée' },
      { value: 'IN_PROGRESS', label: '⚙️ En cours' },
      { value: 'DONE', label: '✅ Terminée' },
      { value: 'CANCELLED', label: '❌ Annulée' },
      { value: 'FAILED', label: '⚠️ Échec' },
    ],
    todo: [
      { value: 'pending', label: '⏳ En attente' },
      { value: 'confirmed', label: '✓ Confirmée' },
      { value: 'in_progress', label: '⚙️ En cours' },
      { value: 'completed', label: '✅ Complétée' },
      { value: 'cancelled', label: '❌ Annulée' },
    ],
    event: [
      { value: 'PENDING', label: '⏳ En attente' },
      { value: 'VALIDATED', label: '✓ Validée' },
      { value: 'PAID', label: '💳 Payée' },
      { value: 'REFUSED', label: '❌ Refusée' },
      { value: 'CANCELLED', label: '🚫 Annulée' },
    ],
  };

  allOrders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;
  error: string | null = null;
  notice: string | null = null;
  filterType = '';
  filterStatus: FilterStatus = '';
  selectedOrder: Order | null = null;

  ngOnInit() {
    this.loadAllOrders();
  }

  loadAllOrders() {
    this.loading = true;
    this.error = null;
    this.notice = null;

    forkJoin({
      shopOrders: this.http.get<any[]>(buildApiUrl('/cshop/orders')).pipe(catchError(() => of([]))),
      grillOrders: this.http.get<any[]>(buildApiUrl('/grill/orders/admin/all')).pipe(catchError(() => of([]))),
      cleanBookings: this.http.get<any[]>(buildApiUrl('/cclean/bookings')).pipe(catchError(() => of([]))),
      todoOrders: this.http.get<any[]>(buildApiUrl('/c-todo/orders')).pipe(catchError(() => of([]))),
      eventBookings: this.http.get<any[]>(buildApiUrl('/c-event/bookings')).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        this.allOrders = [
          ...this.mapOrders(data.shopOrders, 'shop'),
          ...this.mapOrders(data.grillOrders, 'grill'),
          ...this.mapOrders(data.cleanBookings, 'clean'),
          ...this.mapOrders(data.todoOrders, 'todo'),
          ...this.mapOrders(data.eventBookings, 'event')
        ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
        
        this.filteredOrders = this.allOrders;
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des commandes';
        this.loading = false;
      }
    });
  }

  mapOrders(orders: any[], type: OrderType): Order[] {
    if (!Array.isArray(orders)) return [];
    
    return orders.map(order => ({
      id: order.id,
      type,
      customerName: order.user?.firstname && order.user?.lastname 
        ? `${order.user.firstname} ${order.user.lastname}` 
        : order.customerName || 'Client anonyme',
      customerEmail: order.user?.email || order.customerEmail || 'N/A',
      status: this.normalizeIncomingStatus(type, order.status),
      statusGroup: this.toStatusGroup(order.status),
      previousStatus: this.normalizeIncomingStatus(type, order.status),
      totalAmount: order.totalAmount || order.total || order.price || 0,
      createdAt: order.createdAt || new Date().toISOString(),
      items: order.items || order.orderItems || []
    }));
  }

  applyFilters() {
    this.filteredOrders = this.allOrders.filter(order => {
      const typeMatch = !this.filterType || order.type === this.filterType;
      const statusMatch = !this.filterStatus || order.statusGroup === this.filterStatus;
      return typeMatch && statusMatch;
    });
  }

  getOrdersByStatus(status: Exclude<FilterStatus, ''>): Order[] {
    return this.allOrders.filter(o => o.statusGroup === status);
  }

  updateOrderStatus(order: Order) {
    const previousStatus = order.previousStatus;
    order.isUpdating = true;
    this.notice = null;
    this.error = null;

    this.getUpdateRequest(order).subscribe({
      next: () => {
        order.previousStatus = order.status;
        order.statusGroup = this.toStatusGroup(order.status);
        this.notice = `Statut de la commande ${order.id.slice(0, 8)} mis à jour.`;
        this.applyFilters();
      },
      error: (err: unknown) => {
        const errorWithPayload = err as { error?: { message?: string }; message?: string };
        order.status = previousStatus;
        order.statusGroup = this.toStatusGroup(previousStatus);
        this.error =
          errorWithPayload?.error?.message ??
          errorWithPayload?.message ??
          'Impossible de mettre à jour le statut de la commande.';
      },
      complete: () => {
        order.isUpdating = false;
      },
    });
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
  }

  printInvoice(order: Order) {
    if (order.type !== 'shop') {
      this.error = "La facture PDF est disponible uniquement pour les commandes C'Shop.";
      return;
    }
    window.open(buildApiUrl(`/cshop/orders/${order.id}/invoice`), '_blank', 'noopener');
  }

  getStatusOptions(type: OrderType): StatusOption[] {
    return this.statusOptions[type] ?? [];
  }

  private getUpdateRequest(order: Order): Observable<void> {
    switch (order.type) {
      case 'shop':
        return this.http
          .patch(buildApiUrl(`/cshop/orders/${order.id}/status`), {
            status: order.status,
          })
          .pipe(map(() => void 0));
      case 'grill':
        return this.http
          .patch(buildApiUrl(`/grill/orders/admin/${order.id}/status`), {
            status: order.status,
          })
          .pipe(map(() => void 0));
      case 'clean':
        return this.http
          .patch(buildApiUrl(`/cclean/bookings/${order.id}/status`), {
            status: order.status,
          })
          .pipe(map(() => void 0));
      case 'todo':
        return this.http
          .patch(buildApiUrl(`/c-todo/orders/${order.id}/status`), {
            status: order.status,
          })
          .pipe(map(() => void 0));
      case 'event':
        if (order.status === 'VALIDATED') {
          return this.http
            .patch(buildApiUrl(`/c-event/bookings/${order.id}/validate`), {})
            .pipe(map(() => void 0));
        }
        if (order.status === 'REFUSED') {
          return this.http
            .patch(buildApiUrl(`/c-event/bookings/${order.id}/refuse`), {})
            .pipe(map(() => void 0));
        }
        return throwError(() => new Error("Seuls les statuts VALIDATED et REFUSED sont modifiables pour C'Events."));
      default:
        return of(void 0);
    }
  }

  private normalizeIncomingStatus(type: OrderType, status: unknown): string {
    const options = this.getStatusOptions(type);
    if (typeof status === 'string') {
      const found = options.find((opt) => opt.value === status);
      if (found) return found.value;
    }
    return options[0]?.value ?? String(status ?? 'pending');
  }

  private toStatusGroup(status: unknown): Order['statusGroup'] {
    const normalized = String(status ?? '').toLowerCase();
    if (['pending', 'draft', 'payment_pending'].includes(normalized)) {
      return 'pending';
    }
    if (['confirmed', 'paid', 'validated'].includes(normalized)) {
      return 'confirmed';
    }
    if (
      ['processing', 'preparing', 'in_progress', 'assigned', 'ready', 'out_for_delivery', 'shipped'].includes(
        normalized,
      )
    ) {
      return 'processing';
    }
    if (['completed', 'done', 'delivered'].includes(normalized)) {
      return 'completed';
    }
    if (['cancelled', 'failed', 'refused', 'refunded'].includes(normalized)) {
      return 'cancelled';
    }
    return 'other';
  }

  getTypeIcon(type: OrderType): string {
    const icons: any = {
      shop: '🛍️',
      grill: '🍔',
      clean: '🧹',
      todo: '📋',
      event: '🎉'
    };
    return icons[type] || '📦';
  }

  getTypeLabel(type: OrderType): string {
    const labels: any = {
      shop: 'C\'Shop',
      grill: 'C\'Grill',
      clean: 'C\'Clean',
      todo: 'C\'Todo',
      event: 'C\'Events'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const lower = status.toLowerCase();
    const labels: Record<string, string> = {
      pending: '⏳ En attente',
      draft: '📝 Brouillon',
      payment_pending: '💳 Paiement en attente',
      confirmed: '✓ Confirmée',
      validated: '✓ Validée',
      paid: '💳 Payée',
      preparing: '👨‍🍳 Préparation',
      in_progress: '⚙️ En cours',
      processing: '⚙️ En cours',
      assigned: '🧑‍🔧 Assignée',
      ready: '📦 Prête',
      shipped: '🚚 Expédiée',
      out_for_delivery: '🚚 En livraison',
      delivered: '✅ Livrée',
      done: '✅ Terminée',
      completed: '✅ Complétée',
      cancelled: '❌ Annulée',
      failed: '⚠️ Échec',
      refused: '⛔ Refusée',
      refunded: '↩️ Remboursée',
    };
    return labels[lower] || status;
  }
}
