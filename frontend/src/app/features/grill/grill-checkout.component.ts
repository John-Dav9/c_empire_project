import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

type GrillCartItem = {
  id: string;
  kind: 'product' | 'pack';
  title: string;
  price: number;
  imageUrl?: string;
  qty: number;
};

type GrillOrderResponse = {
  id: string;
};

type GrillPaymentInitResponse = {
  paymentId: string;
  providerTransactionId?: string;
  redirectUrl?: string | null;
  provider?: string;
};

@Component({
  selector: 'app-grill-checkout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, MatIconModule],
  template: `
    <section class="grill-checkout page-enter">
      <header class="head app-shell-card">
        <div>
          <h1>Checkout C'Grill</h1>
          <p>Validez votre commande puis procédez au paiement.</p>
        </div>
        <a [routerLink]="['/grill']">Retour au menu</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="success">{{ success }}</p>

      <div class="layout" *ngIf="items.length > 0; else emptyState">
        <section class="left app-shell-card">
          <h2>Votre panier grill</h2>

          <article class="line" *ngFor="let item of items; let i = index">
            <img *ngIf="item.imageUrl" [src]="item.imageUrl" [alt]="item.title" />
            <div class="meta">
              <h3>{{ item.title }}</h3>
              <p>{{ item.kind === 'pack' ? 'Menu pack' : 'Produit grill' }}</p>
              <strong>{{ item.price | currency:'XOF' }}</strong>
            </div>
            <div class="qty-box">
              <button type="button" (click)="decreaseQty(i)">-</button>
              <span>{{ item.qty }}</span>
              <button type="button" (click)="increaseQty(i)">+</button>
            </div>
            <button type="button" class="remove" (click)="removeItem(i)">
              <mat-icon>delete</mat-icon>
            </button>
          </article>
        </section>

        <aside class="right app-shell-card">
          <h2>Informations</h2>

          <label>Nom complet *</label>
          <input [(ngModel)]="fullName" placeholder="Votre nom" />

          <label>Email *</label>
          <input [(ngModel)]="email" placeholder="votre@email.com" />

          <label>Téléphone</label>
          <input [(ngModel)]="phone" placeholder="6xx xx xx xx" />

          <label>Mode de livraison *</label>
          <select [(ngModel)]="deliveryMode">
            <option value="PICKUP">À emporter</option>
            <option value="DELIVERY">Livraison C'Express</option>
          </select>

          <label *ngIf="deliveryMode === 'DELIVERY'">Adresse de livraison *</label>
          <textarea *ngIf="deliveryMode === 'DELIVERY'" [(ngModel)]="address" rows="3" placeholder="Quartier, rue, repère..."></textarea>

          <label>Moyen de paiement *</label>
          <select [(ngModel)]="provider">
            <option value="orange_money">Orange Money</option>
            <option value="mtn_momo">MTN Momo</option>
            <option value="stripe">Carte bancaire (Stripe)</option>
          </select>

          <div class="totals">
            <div><span>Sous-total</span><strong>{{ subtotal | currency:'XOF' }}</strong></div>
            <div><span>Livraison</span><strong>{{ deliveryFee | currency:'XOF' }}</strong></div>
            <div class="total"><span>Total</span><strong>{{ total | currency:'XOF' }}</strong></div>
          </div>

          <button type="button" class="pay" (click)="submit()" [disabled]="loading">
            {{ loading ? 'Traitement...' : 'Commander et payer' }}
          </button>
        </aside>
      </div>

      <ng-template #emptyState>
        <section class="empty app-shell-card">
          <mat-icon>restaurant</mat-icon>
          <h2>Votre panier grill est vide</h2>
          <a [routerLink]="['/grill']">Ajouter des produits</a>
        </section>
      </ng-template>
    </section>
  `,
  styles: [
    `
      .grill-checkout { display:grid; gap:14px; }
      .head { border:1px solid var(--line); border-radius:16px; padding:14px; display:flex; justify-content:space-between; align-items:center; gap:10px; }
      .head h1 { margin:0; }
      .head p { margin:.25rem 0 0; color:var(--ink-2); }
      .head a { text-decoration:none; border-radius:999px; padding:9px 12px; border:1px solid #c90f1f; background:#d70016; color:#fff; font-weight:800; }
      .alert { padding:10px 12px; border-radius:12px; }
      .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
      .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
      .layout { display:grid; grid-template-columns: 1.3fr .9fr; gap:12px; align-items:start; }
      .left, .right { border:1px solid var(--line); border-radius:16px; padding:14px; }
      .left h2, .right h2 { margin:0 0 10px; }
      .line { display:grid; grid-template-columns:84px 1fr auto auto; gap:10px; align-items:center; border:1px solid var(--line); border-radius:12px; padding:10px; margin-bottom:10px; }
      .line img { width:84px; height:84px; object-fit:cover; border-radius:10px; border:1px solid var(--line); }
      .meta h3 { margin:0; font-size:1rem; }
      .meta p { margin:.25rem 0; color:var(--ink-2); }
      .meta strong { color:#c44a18; }
      .qty-box { display:inline-flex; align-items:center; border:1px solid var(--line); border-radius:999px; overflow:hidden; }
      .qty-box button { width:32px; height:32px; border:none; background:#f4f7fb; cursor:pointer; }
      .qty-box span { min-width:30px; text-align:center; font-weight:700; }
      .remove { width:38px; height:38px; border-radius:10px; border:1px solid #f2cbc1; color:#b92016; background:#fff3ef; cursor:pointer; }
      .right { display:grid; gap:8px; }
      .right input, .right select, .right textarea { width:100%; border:1px solid var(--line); border-radius:10px; padding:10px; font:inherit; background:#fff; }
      .right label { font-weight:700; color:var(--ink-1); font-size:.92rem; }
      .totals { margin-top:8px; border:1px solid var(--line); border-radius:12px; padding:10px; display:grid; gap:8px; }
      .totals > div { display:flex; justify-content:space-between; align-items:center; }
      .totals .total { border-top:1px solid var(--line); padding-top:8px; }
      .pay { margin-top:4px; height:48px; border:none; border-radius:999px; background:#d70016; color:#fff; font-weight:800; cursor:pointer; }
      .pay:disabled { opacity:.55; cursor:not-allowed; }
      .empty { border:1px solid var(--line); border-radius:16px; padding:20px; text-align:center; display:grid; justify-items:center; gap:8px; }
      .empty mat-icon { width:38px; height:38px; font-size:38px; color:#c44a18; }
      .empty a { text-decoration:none; border-radius:999px; padding:9px 12px; border:1px solid #c90f1f; background:#d70016; color:#fff; font-weight:800; }
      @media (max-width: 920px) { .layout { grid-template-columns:1fr; } }
      @media (max-width: 680px) { .line { grid-template-columns:1fr; } }
    `,
  ],
})
export class GrillCheckoutComponent implements OnInit {
  private readonly cartStorageKey = 'grillCart';

  items: GrillCartItem[] = [];
  loading = false;
  error: string | null = null;
  success: string | null = null;

  fullName = '';
  email = '';
  phone = '';
  deliveryMode: 'PICKUP' | 'DELIVERY' = 'PICKUP';
  address = '';
  provider: 'orange_money' | 'mtn_momo' | 'stripe' = 'orange_money';

  constructor(
    private readonly api: ApiService,
    private readonly router: Router,
    private readonly authService: AuthService,
  ) {}

  ngOnInit(): void {
    const cart = JSON.parse(localStorage.getItem(this.cartStorageKey) || '[]');
    this.items = (Array.isArray(cart) ? cart : []).map((item: any) => ({
      id: String(item?.id ?? ''),
      kind: (item?.kind === 'pack' ? 'pack' : 'product') as 'product' | 'pack',
      title: String(item?.title ?? 'Article grill'),
      price: Number(item?.price ?? 0),
      imageUrl: String(item?.imageUrl ?? ''),
      qty: Math.max(1, Number(item?.qty ?? 1)),
    })).filter((x) => !!x.id);
  }

  get subtotal(): number {
    return this.items.reduce((sum, item) => sum + Number(item.price) * Number(item.qty), 0);
  }

  get deliveryFee(): number {
    return this.deliveryMode === 'DELIVERY' ? 1500 : 0;
  }

  get total(): number {
    return this.subtotal + this.deliveryFee;
  }

  increaseQty(index: number): void {
    this.items[index].qty += 1;
    this.persist();
  }

  decreaseQty(index: number): void {
    this.items[index].qty = Math.max(1, this.items[index].qty - 1);
    this.persist();
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.persist();
  }

  submit(): void {
    this.error = null;
    this.success = null;

    if (!this.items.length) {
      this.error = 'Votre panier grill est vide.';
      return;
    }

    if (!this.authService.getAccessToken()) {
      this.router.navigate(['/auth/signin'], {
        queryParams: { returnUrl: '/grill/checkout' },
      });
      return;
    }

    if (!this.fullName.trim() || !this.email.trim()) {
      this.error = 'Nom et email sont obligatoires.';
      return;
    }

    if (this.deliveryMode === 'DELIVERY' && !this.address.trim()) {
      this.error = 'Adresse obligatoire pour la livraison.';
      return;
    }

    const orderItems = this.items
      .map((item) =>
        item.kind === 'pack'
          ? { menupackId: String(item.id || '').trim(), qty: Number(item.qty) }
          : { productId: String(item.id || '').trim(), qty: Number(item.qty) },
      )
      .filter((line) =>
        Number(line.qty) > 0 &&
        (Boolean((line as any).productId) || Boolean((line as any).menupackId)),
      );

    if (!orderItems.length) {
      this.error = 'Panier grill invalide. Veuillez supprimer puis réajouter les articles.';
      return;
    }

    const payload = {
      fullName: this.fullName.trim(),
      email: this.email.trim(),
      phone: this.phone.trim() || undefined,
      deliveryMode: this.deliveryMode,
      address: this.deliveryMode === 'DELIVERY' ? this.address.trim() : undefined,
      items: orderItems,
    };

    this.loading = true;
    this.api.post<GrillOrderResponse>('/grill/orders', payload).subscribe({
      next: (order) => {
        this.api
          .post<GrillPaymentInitResponse>(`/grill/orders/${order.id}/pay`, {
            provider: this.provider,
          })
          .subscribe({
            next: (payment) => {
              if (payment.redirectUrl) {
                window.location.href = payment.redirectUrl;
                return;
              }

              if (!payment.providerTransactionId) {
                this.loading = false;
                this.error = 'Paiement initié mais référence introuvable.';
                return;
              }

              this.api
                .post('/payments/verify', {
                  providerTransactionId: payment.providerTransactionId,
                })
                .subscribe({
                  next: () => {
                    this.loading = false;
                    this.persist(true);
                    this.success = 'Commande grill payée avec succès.';
                  },
                  error: () => {
                    this.loading = false;
                    this.error =
                      'Paiement initié. Confirmez dans votre wallet puis réessayez la vérification.';
                  },
                });
            },
            error: (err) => {
              this.loading = false;
              if (err?.status === 401) {
                this.router.navigate(['/auth/signin'], {
                  queryParams: { returnUrl: '/grill/checkout' },
                });
                return;
              }
              this.error =
                this.extractErrorMessage(err) ||
                'Impossible d\'initialiser le paiement.';
            },
          });
      },
      error: (err) => {
        this.loading = false;
        this.error =
          this.extractErrorMessage(err) ||
          'Impossible de créer la commande grill.';
      },
    });
  }

  private persist(clear = false): void {
    localStorage.setItem(this.cartStorageKey, JSON.stringify(clear ? [] : this.items));
  }

  private extractErrorMessage(err: any): string {
    const raw = err?.error;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw?.message)) return raw.message.join(', ');
    if (typeof raw?.message === 'string') return raw.message;
    if (raw?.error && typeof raw.error === 'string') return raw.error;
    return '';
  }
}
