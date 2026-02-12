import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { buildApiUrl } from '../../../core/config/api.config';

interface Order {
  id: string;
  type: 'shop' | 'grill' | 'clean' | 'todo' | 'express' | 'event';
  customerName: string;
  customerEmail: string;
  status: string;
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
            <option value="express">📦 C'Express</option>
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
                        class="status-select"
                        [class]="'status-' + order.status">
                  <option value="pending">⏳ En attente</option>
                  <option value="confirmed">✓ Confirmée</option>
                  <option value="processing">⚙️ En cours</option>
                  <option value="completed">✅ Complétée</option>
                  <option value="cancelled">❌ Annulée</option>
                </select>
              </td>
              <td class="actions">
                <button class="btn-icon" (click)="viewOrderDetails(order)" title="Voir détails">👁️</button>
                <button class="btn-icon" (click)="printInvoice(order)" title="Imprimer">🖨️</button>
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
      &.type-express { background: #e5dbff; color: #7950f2; }
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

  allOrders: Order[] = [];
  filteredOrders: Order[] = [];
  loading = false;
  error: string | null = null;
  filterType = '';
  filterStatus = '';
  selectedOrder: Order | null = null;

  ngOnInit() {
    this.loadAllOrders();
  }

  loadAllOrders() {
    this.loading = true;
    this.error = null;

    forkJoin({
      shopOrders: this.http.get<any[]>(buildApiUrl('/cshop/orders/me')).pipe(catchError(() => of([]))),
      grillOrders: this.http.get<any[]>(buildApiUrl('/grill/orders/admin/all')).pipe(catchError(() => of([]))),
      cleanBookings: this.http.get<any[]>(buildApiUrl('/cclean/bookings')).pipe(catchError(() => of([]))),
      todoOrders: this.http.get<any[]>(buildApiUrl('/c-todo/orders')).pipe(catchError(() => of([])))
    }).subscribe({
      next: (data) => {
        this.allOrders = [
          ...this.mapOrders(data.shopOrders, 'shop'),
          ...this.mapOrders(data.grillOrders, 'grill'),
          ...this.mapOrders(data.cleanBookings, 'clean'),
          ...this.mapOrders(data.todoOrders, 'todo')
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

  mapOrders(orders: any[], type: Order['type']): Order[] {
    if (!Array.isArray(orders)) return [];
    
    return orders.map(order => ({
      id: order.id,
      type,
      customerName: order.user?.firstname && order.user?.lastname 
        ? `${order.user.firstname} ${order.user.lastname}` 
        : order.customerName || 'Client anonyme',
      customerEmail: order.user?.email || order.customerEmail || 'N/A',
      status: order.status || 'pending',
      totalAmount: order.totalAmount || order.total || order.price || 0,
      createdAt: order.createdAt || new Date().toISOString(),
      items: order.items || order.orderItems || []
    }));
  }

  applyFilters() {
    this.filteredOrders = this.allOrders.filter(order => {
      const typeMatch = !this.filterType || order.type === this.filterType;
      const statusMatch = !this.filterStatus || order.status === this.filterStatus;
      return typeMatch && statusMatch;
    });
  }

  getOrdersByStatus(status: string): Order[] {
    return this.allOrders.filter(o => o.status === status);
  }

  updateOrderStatus(order: Order) {
    console.log(`Updating order ${order.id} status to ${order.status}`);
    // Implémentez l'appel API selon le type de commande
  }

  viewOrderDetails(order: Order) {
    this.selectedOrder = order;
  }

  printInvoice(order: Order) {
    console.log('Printing invoice for order:', order.id);
    alert('Fonctionnalité d\'impression en cours de développement');
  }

  getTypeIcon(type: string): string {
    const icons: any = {
      shop: '🛍️',
      grill: '🍔',
      clean: '🧹',
      todo: '📋',
      express: '📦',
      event: '🎉'
    };
    return icons[type] || '📦';
  }

  getTypeLabel(type: string): string {
    const labels: any = {
      shop: 'C\'Shop',
      grill: 'C\'Grill',
      clean: 'C\'Clean',
      todo: 'C\'Todo',
      express: 'C\'Express',
      event: 'C\'Events'
    };
    return labels[type] || type;
  }

  getStatusLabel(status: string): string {
    const labels: any = {
      pending: '⏳ En attente',
      confirmed: '✓ Confirmée',
      processing: '⚙️ En cours',
      completed: '✅ Complétée',
      cancelled: '❌ Annulée'
    };
    return labels[status] || status;
  }
}
