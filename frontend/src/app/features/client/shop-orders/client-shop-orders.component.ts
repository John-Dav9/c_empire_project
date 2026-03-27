import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ApiService } from '../../../core/services/api.service';
import { buildApiUrl } from '../../../core/config/api.config';
import { CurrencyXafPipe } from '../../../shared/pipes/currency-xaf.pipe';

interface OrderItem {
  id: string;
  productId: string;
  productName: string;
  unitPrice: number;
  quantity: number;
}

interface Order {
  id: string;
  totalAmount: number;
  promoCode?: string;
  promoDiscount: number;
  deliveryFee: number;
  deliveryOption: 'cexpress' | 'free' | 'relay' | 'warehouse';
  deliveryAddress?: string;
  deliveryStatus: string;
  status: string;
  isPaid: boolean;
  paymentMethod?: string;
  note?: string;
  items: OrderItem[];
  createdAt: string;
}

@Component({
  selector: 'app-client-shop-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink, MatIconModule, MatProgressSpinnerModule, CurrencyXafPipe],
  template: `
    <section class="orders-page page-enter">

      <header class="head app-shell-card">
        <div>
          <h1>Mes commandes C'Shop</h1>
          <p>Retrouvez l'historique de toutes vos commandes et téléchargez vos factures.</p>
        </div>
        <a routerLink="/shop">Nouvelle commande</a>
      </header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="36" />
          <span>Chargement de vos commandes…</span>
        </div>
      }

      @if (error()) {
        <div class="alert alert-error" role="alert">{{ error() }}</div>
      }

      @if (!loading() && orders().length === 0 && !error()) {
        <section class="empty app-shell-card">
          <mat-icon>shopping_bag</mat-icon>
          <h2>Aucune commande pour le moment</h2>
          <p>Votre historique d'achats apparaîtra ici après votre première commande.</p>
          <a routerLink="/shop">Découvrir la boutique</a>
        </section>
      }

      @if (!loading() && orders().length > 0) {
        <div class="orders-list">
          @for (order of orders(); track order.id) {
            <article class="order-card app-shell-card">

              <!-- En-tête commande -->
              <div class="order-head">
                <div class="order-meta">
                  <span class="order-ref">#{{ order.id.substring(0, 8) }}</span>
                  <span class="order-date">{{ order.createdAt | date:'dd/MM/yyyy à HH:mm' }}</span>
                </div>
                <div class="order-badges">
                  <span class="badge" [class]="statusClass(order.status)">{{ statusLabel(order.status) }}</span>
                  @if (order.isPaid) {
                    <span class="badge badge-paid">Payée</span>
                  }
                </div>
              </div>

              <!-- Résumé articles -->
              <button
                class="items-toggle"
                type="button"
                (click)="toggleExpand(order.id)"
                [attr.aria-expanded]="expandedId() === order.id"
                [attr.aria-label]="'Détails commande ' + order.id.substring(0,8)"
              >
                <span class="items-summary">
                  <mat-icon>inventory_2</mat-icon>
                  {{ order.items.length }} article{{ order.items.length > 1 ? 's' : '' }}
                </span>
                <span class="items-total">{{ grandTotal(order) | currencyXaf }}</span>
                <mat-icon class="chevron" [class.open]="expandedId() === order.id">expand_more</mat-icon>
              </button>

              <!-- Détail (expandable) -->
              @if (expandedId() === order.id) {
                <div class="order-detail">

                  <!-- Articles -->
                  <div class="detail-section">
                    <p class="section-label">Articles</p>
                    <div class="items-grid">
                      @for (item of order.items; track item.id) {
                        <div class="item-row">
                          <span class="item-name">{{ item.productName }}</span>
                          <span class="item-qty">× {{ item.quantity }}</span>
                          <span class="item-price">{{ item.unitPrice * item.quantity | currencyXaf }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Récapitulatif financier -->
                  <div class="detail-section">
                    <p class="section-label">Récapitulatif</p>
                    <div class="recap-rows">
                      <div class="recap-row">
                        <span>Sous-total</span>
                        <span>{{ order.totalAmount + order.promoDiscount | currencyXaf }}</span>
                      </div>
                      @if (order.promoDiscount > 0) {
                        <div class="recap-row recap-promo">
                          <span>Réduction{{ order.promoCode ? ' (' + order.promoCode + ')' : '' }}</span>
                          <span>− {{ order.promoDiscount | currencyXaf }}</span>
                        </div>
                      }
                      @if (order.deliveryFee > 0) {
                        <div class="recap-row">
                          <span>Frais de livraison</span>
                          <span>{{ order.deliveryFee | currencyXaf }}</span>
                        </div>
                      }
                      <div class="recap-row recap-total">
                        <span>Total</span>
                        <span>{{ grandTotal(order) | currencyXaf }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Livraison -->
                  <div class="detail-section">
                    <p class="section-label">Livraison</p>
                    <div class="delivery-info">
                      <div class="info-row">
                        <span>Mode</span>
                        <span>{{ deliveryLabel(order.deliveryOption) }}</span>
                      </div>
                      <div class="info-row">
                        <span>Statut livraison</span>
                        <span class="badge" [class]="deliveryStatusClass(order.deliveryStatus)">{{ deliveryStatusLabel(order.deliveryStatus) }}</span>
                      </div>
                      @if (order.deliveryAddress) {
                        <div class="info-row">
                          <span>Adresse</span>
                          <span>{{ order.deliveryAddress }}</span>
                        </div>
                      }
                      @if (order.note) {
                        <div class="info-row">
                          <span>Note</span>
                          <span>{{ order.note }}</span>
                        </div>
                      }
                    </div>
                  </div>

                  <!-- Actions -->
                  @if (order.isPaid) {
                    <div class="detail-actions">
                      <a
                        [href]="invoiceUrl(order.id)"
                        target="_blank"
                        rel="noopener"
                        class="btn-invoice"
                        aria-label="Télécharger la facture PDF"
                      >
                        <mat-icon>download</mat-icon>
                        Télécharger la facture PDF
                      </a>
                    </div>
                  }

                </div>
              }

            </article>
          }
        </div>
      }

    </section>
  `,
  styles: [`
    .orders-page { display: grid; gap: 14px; }

    .head {
      border: 1px solid var(--line);
      border-radius: 18px;
      padding: 16px;
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 10px;
      flex-wrap: wrap;
    }
    .head h1 { margin: 0; font-size: clamp(1.4rem, 2.3vw, 2rem); }
    .head p  { margin: 6px 0 0; color: #60748d; }
    .head a {
      text-decoration: none;
      border-radius: 999px;
      padding: 10px 14px;
      border: 1px solid #c62828;
      background: linear-gradient(135deg, #c62828, #8e0000);
      color: #fff;
      font-weight: 800;
      white-space: nowrap;
    }

    .loading-state {
      display: flex;
      align-items: center;
      gap: 12px;
      color: #60748d;
      font-weight: 600;
      padding: 2rem;
    }

    .alert {
      padding: 0.875rem 1.25rem;
      border-radius: 10px;
      font-size: 0.875rem;
    }
    .alert-error { background: #fce4ec; color: #c62828; }

    .empty {
      border: 1px solid var(--line);
      border-radius: 16px;
      padding: 2.5rem;
      display: grid;
      place-items: center;
      text-align: center;
      gap: 8px;
    }
    .empty mat-icon { font-size: 2.5rem; width: 2.5rem; height: 2.5rem; color: #9ab; }
    .empty h2 { margin: 0; color: #2f4258; }
    .empty p  { margin: 0; color: #60748d; }
    .empty a {
      margin-top: 6px;
      text-decoration: none;
      border-radius: 999px;
      padding: 9px 18px;
      background: #fce4ec;
      border: 1px solid #f48fb1;
      color: #c62828;
      font-weight: 700;
    }

    .orders-list { display: grid; gap: 10px; }

    .order-card {
      border: 1px solid var(--line);
      border-radius: 16px;
      overflow: hidden;
      background: #fff;
    }

    .order-head {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 12px;
      padding: 14px 16px;
      flex-wrap: wrap;
    }
    .order-meta { display: flex; align-items: center; gap: 12px; }
    .order-ref  { font-family: monospace; font-weight: 700; color: #555; font-size: 0.9rem; }
    .order-date { font-size: 0.8rem; color: #8a9ab0; }
    .order-badges { display: flex; gap: 6px; flex-wrap: wrap; }

    .badge {
      display: inline-block;
      padding: 4px 10px;
      border-radius: 999px;
      font-size: 0.72rem;
      font-weight: 700;
      border: 1px solid;
      white-space: nowrap;
    }
    .badge-pending    { background: #fff8e1; border-color: #ffe082; color: #7a5c00; }
    .badge-confirmed  { background: #e8f5e9; border-color: #a5d6a7; color: #1b5e20; }
    .badge-paid       { background: #e3f2fd; border-color: #90caf9; color: #0d47a1; }
    .badge-preparing  { background: #fff3e0; border-color: #ffcc80; color: #e65100; }
    .badge-shipped    { background: #f3e5f5; border-color: #ce93d8; color: #4a148c; }
    .badge-delivered  { background: #e8f5e9; border-color: #81c784; color: #1b5e20; }
    .badge-cancelled  { background: #f5f5f5; border-color: #bdbdbd; color: #616161; }
    .badge-refunded   { background: #fce4ec; border-color: #f48fb1; color: #880e4f; }

    .items-toggle {
      width: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 16px;
      background: #fafafa;
      border: none;
      border-top: 1px solid #f0f0f0;
      cursor: pointer;
      text-align: left;
      font: inherit;
    }
    .items-toggle:hover { background: #f0f4f8; }
    .items-summary {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 0.85rem;
      font-weight: 600;
      color: #4a6078;
      flex: 1;
    }
    .items-summary mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; color: #7a8fa5; }
    .items-total { font-weight: 800; color: #1a1a2e; font-size: 0.95rem; }
    .chevron { color: #8a9ab0; transition: transform 0.2s; }
    .chevron.open { transform: rotate(180deg); }

    .order-detail {
      display: grid;
      gap: 0;
      border-top: 1px solid #f0f0f0;
    }

    .detail-section {
      padding: 14px 16px;
      border-bottom: 1px solid #f5f5f5;
    }
    .detail-section:last-child { border-bottom: none; }

    .section-label {
      font-size: 0.72rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #9ab;
      margin: 0 0 10px;
    }

    .items-grid { display: grid; gap: 6px; }
    .item-row {
      display: flex;
      align-items: center;
      gap: 10px;
      font-size: 0.875rem;
    }
    .item-name { flex: 1; color: #2f4258; font-weight: 500; }
    .item-qty  { color: #8a9ab0; font-size: 0.8rem; white-space: nowrap; }
    .item-price { font-weight: 700; color: #1a1a2e; white-space: nowrap; }

    .recap-rows { display: grid; gap: 6px; }
    .recap-row {
      display: flex;
      justify-content: space-between;
      font-size: 0.85rem;
      color: #4a6078;
    }
    .recap-promo span:last-child { color: #2e7d32; font-weight: 700; }
    .recap-total {
      border-top: 1px solid #eee;
      padding-top: 8px;
      font-weight: 800;
      color: #1a1a2e;
      font-size: 0.95rem;
    }

    .delivery-info { display: grid; gap: 7px; }
    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 10px;
      font-size: 0.85rem;
    }
    .info-row span:first-child { color: #7a8fa5; }
    .info-row span:last-child  { color: #2f4258; font-weight: 500; text-align: right; }

    .detail-actions {
      padding: 12px 16px;
      background: #fafafa;
      border-top: 1px solid #f0f0f0;
    }
    .btn-invoice {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      padding: 8px 16px;
      border-radius: 10px;
      background: #e8f5e9;
      border: 1px solid #a5d6a7;
      color: #1b5e20;
      font-weight: 700;
      font-size: 0.85rem;
    }
    .btn-invoice:hover { background: #c8e6c9; }
    .btn-invoice mat-icon { font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }

    @media (max-width: 600px) {
      .order-head { padding: 10px 12px; }
      .items-toggle { padding: 8px 12px; }
      .detail-section { padding: 12px; }
      .item-row { flex-wrap: wrap; }
    }
  `],
})
export class ClientShopOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly orders   = signal<Order[]>([]);
  readonly loading  = signal(true);
  readonly error    = signal<string | null>(null);
  readonly expandedId = signal<string | null>(null);

  ngOnInit(): void {
    this.api.get<Order[]>('/cshop/orders/me').subscribe({
      next: (data) => {
        this.orders.set(Array.isArray(data) ? data : []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.error?.message ?? 'Impossible de charger vos commandes.');
        this.loading.set(false);
      },
    });
  }

  toggleExpand(orderId: string): void {
    this.expandedId.set(this.expandedId() === orderId ? null : orderId);
  }

  grandTotal(order: Order): number {
    return Number(order.totalAmount) + Number(order.deliveryFee);
  }

  invoiceUrl(orderId: string): string {
    return buildApiUrl(`/cshop/orders/${orderId}/invoice`);
  }

  statusLabel(status: string): string {
    const map: Record<string, string> = {
      pending:   'En attente',
      confirmed: 'Confirmée',
      paid:      'Payée',
      preparing: 'En préparation',
      shipped:   'Expédiée',
      delivered: 'Livrée',
      cancelled: 'Annulée',
      refunded:  'Remboursée',
    };
    return map[status] ?? status;
  }

  statusClass(status: string): string {
    const map: Record<string, string> = {
      pending:   'badge-pending',
      confirmed: 'badge-confirmed',
      paid:      'badge-paid',
      preparing: 'badge-preparing',
      shipped:   'badge-shipped',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled',
      refunded:  'badge-refunded',
    };
    return map[status] ?? 'badge-pending';
  }

  deliveryLabel(option: string): string {
    const map: Record<string, string> = {
      cexpress:  "C'Express",
      free:      'Livraison gratuite',
      relay:     'Point relais',
      warehouse: 'Retrait entrepôt',
    };
    return map[option] ?? option;
  }

  deliveryStatusLabel(status: string): string {
    const map: Record<string, string> = {
      pending:   'En attente',
      quoted:    'Devis établi',
      assigned:  'Livreur assigné',
      picked:    'Collecté',
      delivered: 'Livré',
      cancelled: 'Annulé',
    };
    return map[status] ?? status;
  }

  deliveryStatusClass(status: string): string {
    const map: Record<string, string> = {
      pending:   'badge-pending',
      quoted:    'badge-preparing',
      assigned:  'badge-confirmed',
      picked:    'badge-shipped',
      delivered: 'badge-delivered',
      cancelled: 'badge-cancelled',
    };
    return map[status] ?? 'badge-pending';
  }
}
