import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DatePipe, CurrencyPipe } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface GrillOrderItem {
  id: string;
  titleSnapshot: string;
  unitPriceSnapshot: number;
  qty: number;
  lineTotal: number;
}

interface GrillOrder {
  id: string;
  status: string;
  deliveryMode: string;
  address?: string;
  subtotal: number;
  deliveryFee: number;
  total: number;
  currency: string;
  createdAt: string;
  items: GrillOrderItem[];
}

@Component({
  selector: 'app-client-grill-orders',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, CurrencyPipe, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head">
        <div>
          <h1>Mes commandes C'Grill</h1>
          <p>{{ orders().length }} commande{{ orders().length > 1 ? 's' : '' }}</p>
        </div>
        <a routerLink="/grill" class="btn-new">Nouvelle commande</a>
      </header>

      @if (error()) {
        <p class="alert error" role="alert">{{ error() }}</p>
      }

      @if (loading()) {
        <div class="loading">Chargement…</div>
      }

      @if (!loading()) {
        @if (orders().length === 0) {
          <div class="empty-state">
            <p class="empty-icon">🍖</p>
            <h2>Aucune commande</h2>
            <p>Vous n'avez pas encore passé de commande C'Grill.</p>
            <a routerLink="/grill" class="btn-new">Commander maintenant</a>
          </div>
        } @else {
          <div class="orders-list">
            @for (order of orders(); track order.id) {
              <div class="order-card">
                <div class="order-head">
                  <div class="order-meta">
                    <span class="order-id">#{{ order.id.substring(0, 8) }}</span>
                    <span class="order-date">{{ order.createdAt | date:'dd/MM/yyyy HH:mm' }}</span>
                  </div>
                  <span class="status-badge" [class]="'st-' + order.status">
                    {{ statusLabel(order.status) }}
                  </span>
                </div>

                <ul class="items-list">
                  @for (item of order.items; track item.id) {
                    <li class="item-row">
                      <span class="item-name">{{ item.titleSnapshot }}</span>
                      <span class="item-qty">x{{ item.qty }}</span>
                      <span class="item-price">{{ item.lineTotal | currency:order.currency:'symbol':'1.0-0' }}</span>
                    </li>
                  }
                </ul>

                <div class="order-footer">
                  <span class="delivery-mode">
                    {{ order.deliveryMode === 'DELIVERY' ? '🚴 Livraison' : '🏠 Emporter' }}
                    @if (order.address) { — {{ order.address }} }
                  </span>
                  <div class="totals">
                    @if (order.deliveryFee > 0) {
                      <span class="fee">Livraison : {{ order.deliveryFee | currency:order.currency:'symbol':'1.0-0' }}</span>
                    }
                    <span class="total">Total : {{ order.total | currency:order.currency:'symbol':'1.0-0' }}</span>
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
    .head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 10px; }
    .head h1 { margin: 0; font-size: 1.25rem; }
    .head p  { margin: 4px 0 0; color: #60748d; font-size: .85rem; }
    .btn-new { background: #0f8a77; color: #fff; text-decoration: none; border-radius: 8px; padding: 8px 16px; font-weight: 700; font-size: .85rem; }
    .loading { color: #60748d; padding: 1rem; }
    .alert { padding: 10px 12px; border-radius: 10px; margin: 0; }
    .alert.error { background: #fff3ef; border: 1px solid #f5c5b7; color: #b92016; }
    .empty-state { text-align: center; padding: 4rem 2rem; }
    .empty-icon { font-size: 3rem; margin: 0; }
    .empty-state h2 { font-size: 1.1rem; color: #1a2e40; margin: 1rem 0 .5rem; }
    .empty-state p  { color: #60748d; }
    .empty-state .btn-new { display: inline-block; margin-top: 1rem; }
    .orders-list { display: grid; gap: 12px; }
    .order-card { background: #fff; border: 1px solid #eef2f8; border-radius: 14px; padding: 16px; display: grid; gap: 12px; }
    .order-head { display: flex; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 8px; }
    .order-meta { display: flex; align-items: center; gap: 8px; }
    .order-id { font-weight: 700; color: #1a2e40; font-size: .9rem; }
    .order-date { color: #60748d; font-size: .8rem; }
    .status-badge { border-radius: 999px; padding: 3px 10px; font-size: .75rem; font-weight: 700; border: 1px solid; white-space: nowrap; }
    .st-PENDING         { background: #fff8e1; border-color: #ffe082; color: #7a5c00; }
    .st-PAID            { background: #e8f5e9; border-color: #66bb6a; color: #1b5e20; }
    .st-PREPARING       { background: #e3f2fd; border-color: #90caf9; color: #0d47a1; }
    .st-READY           { background: #f3e5f5; border-color: #ce93d8; color: #4a148c; }
    .st-OUT_FOR_DELIVERY { background: #e8eaf6; border-color: #9fa8da; color: #283593; }
    .st-DELIVERED       { background: #e8f5e9; border-color: #a5d6a7; color: #1b5e20; }
    .st-CANCELLED       { background: #f5f5f5; border-color: #bdbdbd; color: #616161; }
    .items-list { list-style: none; margin: 0; padding: 0; display: grid; gap: 6px; }
    .item-row { display: flex; align-items: center; gap: 8px; font-size: .85rem; }
    .item-name { flex: 1; color: #1a2e40; }
    .item-qty { color: #60748d; }
    .item-price { font-weight: 700; color: #1a2e40; }
    .order-footer { display: flex; justify-content: space-between; align-items: flex-end; flex-wrap: wrap; gap: 8px; border-top: 1px solid #eef2f8; padding-top: 10px; font-size: .82rem; }
    .delivery-mode { color: #60748d; }
    .totals { display: flex; flex-direction: column; align-items: flex-end; gap: 2px; }
    .fee { color: #60748d; }
    .total { font-weight: 800; color: #1a2e40; font-size: .95rem; }
  `],
})
export class ClientGrillOrdersComponent implements OnInit {
  private readonly api = inject(ApiService);

  readonly orders = signal<GrillOrder[]>([]);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  ngOnInit(): void {
    this.api.get<GrillOrder[]>('/grill/orders/me').subscribe({
      next: (data) => { this.orders.set(Array.isArray(data) ? data : []); this.loading.set(false); },
      error: (err) => { this.error.set(err?.error?.message ?? 'Impossible de charger vos commandes.'); this.loading.set(false); },
    });
  }

  statusLabel(s: string): string {
    const m: Record<string, string> = {
      PENDING: 'En attente',
      PAID: 'Payée',
      PREPARING: 'En préparation',
      READY: 'Prête',
      OUT_FOR_DELIVERY: 'En livraison',
      DELIVERED: 'Livrée',
      CANCELLED: 'Annulée',
    };
    return m[s] ?? s;
  }
}
