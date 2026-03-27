import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { buildApiUrl } from '../../../core/config/api.config';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { CurrencyXafPipe } from '../../../shared/pipes/currency-xaf.pipe';

interface GrillOrderItem {
  id: string;
  titleSnapshot: string;
  unitPriceSnapshot: number;
  qty: number;
  lineTotal: number;
}

interface GrillOrder {
  id: string;
  fullName: string;
  email: string;
  phone?: string;
  deliveryMode: 'PICKUP' | 'DELIVERY';
  address?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  status: string;
  paymentId?: string;
  expressOrderId?: string;
  items: GrillOrderItem[];
  createdAt: string;
}

const STATUS_OPTIONS = [
  { value: 'PENDING',          label: 'En attente' },
  { value: 'PAID',             label: 'Payée' },
  { value: 'CONFIRMED',        label: 'Confirmée' },
  { value: 'PREPARING',        label: 'En préparation' },
  { value: 'READY',            label: 'Prête' },
  { value: 'OUT_FOR_DELIVERY', label: 'En livraison' },
  { value: 'DELIVERED',        label: 'Livrée' },
  { value: 'CANCELLED',        label: 'Annulée' },
  { value: 'REFUSED',          label: 'Refusée' },
];

@Component({
  selector: 'app-grill-orders',
  imports: [
    DatePipe,
    FormsModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
    StatusBadgeComponent,
    CurrencyXafPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page">
      <app-page-header
        title="Commandes C'Grill"
        [subtitle]="orders().length + ' commande' + (orders().length > 1 ? 's' : '') + ' au total'"
        [breadcrumbs]="breadcrumbs"
      >
        <button mat-stroked-button slot="actions" (click)="load()">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
      </app-page-header>

      <!-- KPIs -->
      <div class="kpi-row">
        @for (kpi of kpis(); track kpi.label) {
          <div class="kpi-pill" [style.border-bottom-color]="kpi.color">
            <span class="kpi-num" [style.color]="kpi.color">{{ kpi.count }}</span>
            <span class="kpi-lbl">{{ kpi.label }}</span>
          </div>
        }
      </div>

      <!-- Filtres -->
      <div class="filters-row">
        <select [(ngModel)]="filterStatus" (ngModelChange)="applyFilter()" class="filter-select" aria-label="Filtrer par statut">
          <option value="">Tous les statuts</option>
          @for (s of statusOptions; track s.value) {
            <option [value]="s.value">{{ s.label }}</option>
          }
        </select>
        <select [(ngModel)]="filterMode" (ngModelChange)="applyFilter()" class="filter-select" aria-label="Filtrer par mode">
          <option value="">Tous les modes</option>
          <option value="PICKUP">Emporter</option>
          <option value="DELIVERY">Livraison</option>
        </select>
      </div>

      @if (loading()) {
        <div class="loading-state"><mat-spinner diameter="40" /></div>
      } @else if (error()) {
        <div class="alert-error" role="alert">{{ error() }}</div>
      } @else {
        <div class="table-wrapper">
          <table class="orders-table" aria-label="Commandes C'Grill">
            <thead>
              <tr>
                <th scope="col">N°</th>
                <th scope="col">Client</th>
                <th scope="col">Mode</th>
                <th scope="col">Total</th>
                <th scope="col">Paiement</th>
                <th scope="col">Statut</th>
                <th scope="col">Date</th>
                <th scope="col">Actions</th>
              </tr>
            </thead>
            <tbody>
              @for (order of filtered(); track order.id) {
                <tr [class.row--paid]="order.paymentId">
                  <td class="mono">#{{ order.id.substring(0, 8) }}</td>
                  <td>
                    <p class="customer-name">{{ order.fullName }}</p>
                    <p class="customer-email">{{ order.email }}</p>
                  </td>
                  <td>
                    <span class="mode-badge" [class.mode-delivery]="order.deliveryMode === 'DELIVERY'">
                      {{ order.deliveryMode === 'DELIVERY' ? '🚴 Livraison' : '🏠 Emporter' }}
                    </span>
                    @if (order.address) {
                      <p class="address-text">{{ order.address }}</p>
                    }
                  </td>
                  <td class="amount">{{ order.total | currencyXaf }}</td>
                  <td>
                    @if (order.paymentId) {
                      <span class="paid-chip">✓ Payée</span>
                    } @else {
                      <span class="unpaid-chip">En attente</span>
                    }
                  </td>
                  <td>
                    <select
                      [ngModel]="order.status"
                      (ngModelChange)="updateStatus(order, $event)"
                      class="status-select"
                      [attr.aria-label]="'Statut de la commande ' + order.id.substring(0,8)"
                    >
                      @for (s of statusOptions; track s.value) {
                        <option [value]="s.value">{{ s.label }}</option>
                      }
                    </select>
                  </td>
                  <td class="date-cell">{{ order.createdAt | date:'dd/MM/yy HH:mm' }}</td>
                  <td>
                    <button mat-icon-button (click)="openDetail(order)" aria-label="Voir le détail">
                      <mat-icon>visibility</mat-icon>
                    </button>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="8" class="empty-cell">
                    <mat-icon>restaurant</mat-icon>
                    <p>Aucune commande trouvée</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Drawer détail -->
      @if (detail()) {
        <div class="drawer-overlay" (click)="detail.set(null)" role="dialog" aria-modal="true" aria-label="Détail commande">
          <aside class="drawer" (click)="$event.stopPropagation()">
            <div class="drawer-header">
              <h2>Commande #{{ detail()!.id.substring(0, 8) }}</h2>
              <button mat-icon-button (click)="detail.set(null)" aria-label="Fermer"><mat-icon>close</mat-icon></button>
            </div>

            <div class="drawer-body">
              <div class="detail-section">
                <h3>Client</h3>
                <p><strong>{{ detail()!.fullName }}</strong></p>
                <p>{{ detail()!.email }}</p>
                @if (detail()!.phone) { <p>{{ detail()!.phone }}</p> }
              </div>

              <div class="detail-section">
                <h3>Livraison</h3>
                <p>{{ detail()!.deliveryMode === 'DELIVERY' ? '🚴 Livraison à domicile' : '🏠 À emporter' }}</p>
                @if (detail()!.address) { <p class="address-text">{{ detail()!.address }}</p> }
              </div>

              <div class="detail-section">
                <h3>Articles</h3>
                <div class="items-list">
                  @for (item of detail()!.items; track item.id) {
                    <div class="item-row">
                      <span class="item-name">{{ item.titleSnapshot }}</span>
                      <span class="item-qty">× {{ item.qty }}</span>
                      <span class="item-price">{{ item.lineTotal | currencyXaf }}</span>
                    </div>
                  }
                </div>
                <div class="totals">
                  <div class="total-row">
                    <span>Sous-total</span>
                    <span>{{ detail()!.subtotal | currencyXaf }}</span>
                  </div>
                  @if (detail()!.deliveryFee > 0) {
                    <div class="total-row">
                      <span>Livraison</span>
                      <span>{{ detail()!.deliveryFee | currencyXaf }}</span>
                    </div>
                  }
                  <div class="total-row total-row--bold">
                    <span>Total</span>
                    <span>{{ detail()!.total | currencyXaf }}</span>
                  </div>
                </div>
              </div>

              <div class="detail-section">
                <h3>Statut actuel</h3>
                <app-status-badge [status]="detail()!.status" size="lg" />
              </div>

              @if (notice()) {
                <div class="notice-ok">{{ notice() }}</div>
              }
              @if (error()) {
                <div class="alert-error">{{ error() }}</div>
              }
            </div>
          </aside>
        </div>
      }
    </div>
  `,
  styles: [`
    .page { padding: 2rem; max-width: 1400px; margin: 0 auto; }

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
    .filter-select:focus { outline: none; border-color: #e65100; }

    .loading-state { display: flex; justify-content: center; padding: 3rem; }
    .alert-error { padding: .875rem 1.25rem; border-radius: 8px; background: #fce4ec; color: #c62828; margin-bottom: 1rem; }

    .table-wrapper { background: white; border-radius: 12px; box-shadow: 0 2px 12px rgba(0,0,0,.06); overflow-x: auto; }
    .orders-table { width: 100%; border-collapse: collapse; }
    .orders-table thead th {
      padding: 1rem; text-align: left; font-size: .75rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: .05em; color: #888;
      background: #fafafa; border-bottom: 1px solid #f0f0f0; white-space: nowrap;
    }
    .orders-table tbody tr { border-bottom: 1px solid #f5f5f5; transition: background .15s; }
    .orders-table tbody tr:hover { background: #fafafa; }
    .orders-table tbody tr.row--paid { border-left: 3px solid #2e7d32; }
    .orders-table tbody td { padding: .875rem 1rem; font-size: .875rem; color: #333; vertical-align: middle; }
    .mono { font-family: monospace; font-size: .8rem; color: #888; }
    .customer-name { font-weight: 600; color: #1a1a2e; margin: 0 0 .1rem; }
    .customer-email { font-size: .72rem; color: #aaa; margin: 0; }
    .mode-badge { font-size: .78rem; font-weight: 600; }
    .mode-delivery { color: #1565c0; }
    .address-text { font-size: .72rem; color: #aaa; margin: .1rem 0 0; }
    .amount { font-weight: 700; }
    .paid-chip   { background: #e8f5e9; color: #2e7d32; border-radius: 999px; padding: .2rem .65rem; font-size: .72rem; font-weight: 700; }
    .unpaid-chip { background: #fff8e1; color: #7a5c00; border-radius: 999px; padding: .2rem .65rem; font-size: .72rem; font-weight: 700; }
    .status-select {
      padding: .35rem .65rem; border: 1px solid #e0e0e0; border-radius: 8px;
      font-size: .8rem; background: white; cursor: pointer;
    }
    .date-cell { white-space: nowrap; color: #888; font-size: .8rem; }
    .empty-cell { text-align: center; padding: 3rem !important; color: #aaa; }
    .empty-cell mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; display: block; margin: 0 auto .5rem; }
    .empty-cell p { margin: 0; }

    /* Drawer */
    .drawer-overlay { position: fixed; inset: 0; background: rgba(0,0,0,.4); z-index: 1000; display: flex; justify-content: flex-end; }
    .drawer { width: 440px; max-width: 100%; background: white; height: 100%; overflow-y: auto; box-shadow: -4px 0 24px rgba(0,0,0,.12); }
    .drawer-header { display: flex; justify-content: space-between; align-items: center; padding: 1.25rem 1.5rem; border-bottom: 1px solid #f0f0f0; }
    .drawer-header h2 { margin: 0; font-size: 1.1rem; font-weight: 700; color: #1a1a2e; }
    .drawer-body { padding: 1.5rem; display: flex; flex-direction: column; gap: 1.5rem; }
    .detail-section h3 { font-size: .8rem; font-weight: 700; text-transform: uppercase; letter-spacing: .05em; color: #aaa; margin: 0 0 .75rem; }
    .detail-section p { margin: .2rem 0; font-size: .9rem; color: #333; }
    .items-list { display: flex; flex-direction: column; gap: .5rem; margin-bottom: 1rem; }
    .item-row { display: flex; align-items: center; gap: .5rem; font-size: .875rem; }
    .item-name { flex: 1; color: #1a2e40; }
    .item-qty { color: #888; }
    .item-price { font-weight: 700; }
    .totals { border-top: 1px solid #f0f0f0; padding-top: .75rem; display: flex; flex-direction: column; gap: .4rem; }
    .total-row { display: flex; justify-content: space-between; font-size: .875rem; color: #555; }
    .total-row--bold { font-weight: 800; color: #1a2e40; font-size: 1rem; }
    .notice-ok { padding: .75rem 1rem; border-radius: 8px; background: #e8f5e9; color: #2e7d32; font-size: .875rem; }
  `],
})
export class GrillOrdersComponent implements OnInit {
  private readonly http = inject(HttpClient);

  readonly orders  = signal<GrillOrder[]>([]);
  readonly filtered = signal<GrillOrder[]>([]);
  readonly loading = signal(true);
  readonly error   = signal<string | null>(null);
  readonly notice  = signal<string | null>(null);
  readonly detail  = signal<GrillOrder | null>(null);

  filterStatus = '';
  filterMode   = '';
  readonly statusOptions = STATUS_OPTIONS;
  readonly breadcrumbs = [
    { label: 'Super Admin', link: '/super-admin/dashboard' },
    { label: "C'Grill" },
    { label: 'Commandes' },
  ];

  readonly kpis = () => [
    { label: 'Total',       count: this.orders().length,                                              color: '#1a1a2e' },
    { label: 'En attente',  count: this.orders().filter(o => o.status === 'PENDING').length,          color: '#e65100' },
    { label: 'Payées',      count: this.orders().filter(o => o.status === 'PAID').length,             color: '#1565c0' },
    { label: 'Préparation', count: this.orders().filter(o => ['CONFIRMED','PREPARING','READY'].includes(o.status)).length, color: '#7b1fa2' },
    { label: 'Livrées',     count: this.orders().filter(o => o.status === 'DELIVERED').length,        color: '#2e7d32' },
    { label: 'Annulées',    count: this.orders().filter(o => ['CANCELLED','REFUSED'].includes(o.status)).length, color: '#c62828' },
  ];

  ngOnInit(): void { this.load(); }

  load(): void {
    this.loading.set(true);
    this.error.set(null);
    this.http.get<GrillOrder[]>(buildApiUrl('/grill/orders/admin/all')).subscribe({
      next: (data) => {
        this.orders.set(data);
        this.applyFilter();
        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger les commandes.');
        this.loading.set(false);
      },
    });
  }

  applyFilter(): void {
    this.filtered.set(
      this.orders().filter(o => {
        const statusOk = !this.filterStatus || o.status === this.filterStatus;
        const modeOk   = !this.filterMode   || o.deliveryMode === this.filterMode;
        return statusOk && modeOk;
      })
    );
  }

  updateStatus(order: GrillOrder, status: string): void {
    this.notice.set(null);
    this.error.set(null);
    this.http.patch(buildApiUrl(`/grill/orders/admin/${order.id}/status`), { status }).subscribe({
      next: () => {
        this.orders.update(list => list.map(o => o.id === order.id ? { ...o, status } : o));
        this.applyFilter();
        this.notice.set(`Statut mis à jour → ${STATUS_OPTIONS.find(s => s.value === status)?.label}`);
        setTimeout(() => this.notice.set(null), 3000);
      },
      error: () => this.error.set('Impossible de mettre à jour le statut.'),
    });
  }

  openDetail(order: GrillOrder): void {
    this.detail.set(order);
  }
}
