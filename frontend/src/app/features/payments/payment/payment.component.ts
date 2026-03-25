import {
  ChangeDetectionStrategy,
  Component,
  OnDestroy,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, map, switchMap, throwError, timer } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { buildMediaUrl } from '../../../core/config/api.config';
import { ShopCartItem, ShopCartService } from '../../../core/services/shop-cart.service';
import { CurrencyXafPipe } from '../../../shared/pipes/currency-xaf.pipe';

type DeliveryMode = 'cexpress' | 'free' | 'relay' | 'warehouse';

interface RelayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  phone?: string;
  openingHours?: string;
}

interface PromoValidationResponse {
  valid: boolean;
  code?: string;
  type?: 'percent' | 'fixed';
  value?: number;
  productIds?: string[];
}

interface InitPaymentResponse {
  paymentId: string;
  providerTransactionId?: string;
  provider?: string;
  amount: number;
  currency: string;
  redirectUrl?: string | null;
  instructions?: string | null;
}

@Component({
  selector: 'app-payment',
  imports: [
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    CurrencyXafPipe,
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PaymentComponent implements OnInit, OnDestroy {
  private readonly api = inject(ApiService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly fb = inject(FormBuilder);
  private readonly shopCartService = inject(ShopCartService);
  private readonly checkoutSelectionKey = 'checkoutCartItemIds';

  // ── Forms ────────────────────────────────────────────────────────────────
  readonly formGroup = this.fb.group({
    method: ['', Validators.required],
    deliveryMode: ['free' as DeliveryMode, Validators.required],
  });
  readonly billingForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    phone: ['', Validators.required],
    address: ['', Validators.required],
    city: ['', Validators.required],
  });

  // ── State ────────────────────────────────────────────────────────────────
  readonly checkoutItems = signal<ShopCartItem[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly success = signal(false);
  readonly successOrderId = signal<string | null>(null);
  readonly successPaymentRef = signal<string | null>(null);
  readonly pendingPaymentRef = signal<string | null>(null);
  readonly pendingInstructions = signal<string | null>(null);
  readonly pendingInfo = signal<string | null>(null);
  readonly promoCode = signal('');
  readonly promoDiscount = signal(0);
  readonly promoMessage = signal<string | null>(null);
  readonly promoAppliedCode = signal<string | null>(null);
  readonly promoChecking = signal(false);
  readonly selectedDeliveryMode = signal<DeliveryMode>('free');
  readonly selectedRelayPointId = signal<string | null>(null);
  readonly relayPoints = signal<RelayPoint[]>([]);
  readonly relayPointsLoading = signal(false);

  // ── Computed ─────────────────────────────────────────────────────────────
  readonly cartSubtotal = computed(() =>
    this.checkoutItems().reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    ),
  );

  readonly cartItemCount = computed(() =>
    this.checkoutItems().reduce((sum, item) => sum + Number(item.quantity), 0),
  );

  readonly deliveryFee = computed(() => {
    if (this.selectedDeliveryMode() === 'cexpress') return 7500;
    return 0;
  });

  readonly deliveryFeeLabel = computed(() => {
    const mode = this.selectedDeliveryMode();
    if (mode === 'cexpress') return "C'Express — 7 500 XAF";
    if (mode === 'relay') return 'Retrait point relais — Gratuit';
    if (mode === 'warehouse') return 'Retrait entrepôt — Gratuit';
    return 'Livraison gratuite';
  });

  readonly totalAfterPromo = computed(() =>
    Math.max(
      0,
      this.cartSubtotal() + this.deliveryFee() - this.promoDiscount(),
    ),
  );

  readonly canSubmit = computed(
    () =>
      this.billingForm.valid &&
      !!this.formGroup.value.method &&
      !this.loading() &&
      this.checkoutItems().length > 0 &&
      (this.selectedDeliveryMode() !== 'relay' || !!this.selectedRelayPointId()),
  );

  readonly paymentMethods = [
    { id: 'orange_money', name: 'Orange Money', icon: 'payments' },
    { id: 'mtn_momo', name: 'MTN Momo', icon: 'phone' },
    { id: 'wave', name: 'Wave', icon: 'account_balance_wallet' },
    { id: 'stripe', name: 'Carte Bancaire', icon: 'credit_card' },
  ] as const;

  readonly deliveryModes: { id: DeliveryMode; label: string; desc: string; badge?: string; fee: string }[] = [
    {
      id: 'free',
      label: 'Livraison gratuite',
      desc: 'Livraison standard offerte sur cette commande.',
      fee: 'Gratuit',
    },
    {
      id: 'cexpress',
      label: "C'Express",
      desc: 'Livraison prioritaire, rapide et suivie.',
      badge: 'Rapide',
      fee: '7 500 XAF',
    },
    {
      id: 'relay',
      label: 'Point relais',
      desc: 'Retrait chez un commerçant partenaire.',
      fee: 'Gratuit',
    },
    {
      id: 'warehouse',
      label: 'Retrait entrepôt',
      desc: 'Venez récupérer votre commande à notre entrepôt.',
      fee: 'Gratuit',
    },
  ];

  private checkoutSelection: string[] = [];
  private verifyPollingSub?: Subscription;

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.loadCheckoutCart();
      this.handleStripeReturn(params as Record<string, string>);
    });
  }

  ngOnDestroy(): void {
    this.verifyPollingSub?.unsubscribe();
  }

  selectPaymentMethod(id: string): void {
    this.formGroup.patchValue({ method: id });
  }

  selectDeliveryMode(mode: DeliveryMode): void {
    this.selectedDeliveryMode.set(mode);
    this.selectedRelayPointId.set(null);
    this.formGroup.patchValue({ deliveryMode: mode });
    if (mode === 'relay' && this.relayPoints().length === 0) {
      this.loadRelayPoints();
    }
  }

  selectRelayPoint(id: string): void {
    this.selectedRelayPointId.set(id);
  }

  applyPromoCode(): void {
    const code = this.promoCode().trim();
    if (!code) {
      this.promoDiscount.set(0);
      this.promoAppliedCode.set(null);
      this.promoMessage.set(null);
      return;
    }
    const items = this.checkoutItems();
    const subtotal = items.reduce(
      (sum, item) => sum + Number(item.price) * Number(item.quantity),
      0,
    );
    if (subtotal <= 0) {
      this.promoDiscount.set(0);
      this.promoMessage.set('Panier vide: impossible de calculer la remise.');
      return;
    }
    this.promoChecking.set(true);
    this.api
      .get<PromoValidationResponse>(
        `/cshop/promotions/public/code/${encodeURIComponent(code)}`,
      )
      .subscribe({
        next: (promo) => {
          this.promoChecking.set(false);
          if (!promo?.valid || !promo.productIds?.length || !promo.type || !promo.value) {
            this.promoDiscount.set(0);
            this.promoAppliedCode.set(null);
            this.promoMessage.set('Code promo invalide ou expiré.');
            return;
          }
          const eligibleSubtotal = items.reduce((sum, item) => {
            if (!promo.productIds!.includes((item as unknown as Record<string, string>)['productId'] ?? '')) return sum;
            return sum + Number(item.price) * Number(item.quantity);
          }, 0);
          if (eligibleSubtotal <= 0) {
            this.promoDiscount.set(0);
            this.promoAppliedCode.set(null);
            this.promoMessage.set("Ce code promo ne s'applique à aucun article du panier.");
            return;
          }
          const raw =
            promo.type === 'percent'
              ? (eligibleSubtotal * Number(promo.value)) / 100
              : Number(promo.value);
          const discount = Math.max(0, Math.min(raw, eligibleSubtotal));
          this.promoDiscount.set(discount);
          this.promoAppliedCode.set(promo.code || code.toUpperCase());
          this.promoMessage.set(
            `Code ${this.promoAppliedCode()} appliqué (${discount.toLocaleString('fr-FR')} XAF).`,
          );
        },
        error: () => {
          this.promoChecking.set(false);
          this.promoDiscount.set(0);
          this.promoAppliedCode.set(null);
          this.promoMessage.set('Impossible de vérifier le code promo.');
        },
      });
  }

  submitPayment(): void {
    if (!this.canSubmit()) return;

    this.loading.set(true);
    this.error.set(null);
    this.pendingInfo.set(null);

    const billing = this.billingForm.value;
    const mode = this.selectedDeliveryMode();

    const checkoutData: Record<string, unknown> = {
      deliveryAddress: `${billing.address}, ${billing.city}`,
      note: `Contact: ${billing.phone}`,
      deliveryOption: mode,
      promoCode: this.promoCode().trim() || undefined,
      cartItemIds: this.checkoutSelection,
    };
    if (mode === 'relay' && this.selectedRelayPointId()) {
      checkoutData['relayPointId'] = this.selectedRelayPointId();
    }

    this.api
      .post<{ id: string }>('/cshop/orders/checkout', checkoutData)
      .pipe(
        switchMap((order) => {
          if (!order?.id) return throwError(() => new Error('Impossible de créer la commande.'));
          const paymentData = {
            referenceType: 'shop_order',
            referenceId: order.id,
            currency: 'XAF',
            provider: this.formGroup.value.method,
            metadata: { billingInfo: billing },
          };
          return this.api
            .post<InitPaymentResponse>('/payments/init', paymentData)
            .pipe(map((payment) => ({ order, payment })));
        }),
      )
      .subscribe({
        next: ({ order, payment }) => {
          if (payment?.redirectUrl) {
            this.loading.set(false);
            this.successOrderId.set(order.id);
            this.successPaymentRef.set(payment.providerTransactionId ?? payment.paymentId);
            window.location.href = payment.redirectUrl;
            return;
          }
          const ref = String(payment?.providerTransactionId || '').trim();
          if (!ref) {
            this.loading.set(false);
            this.error.set('Paiement initialisé, mais confirmation impossible (référence absente).');
            return;
          }
          const provider = String(payment?.provider || this.formGroup.value.method || '');
          if (this.isMobileMoney(provider)) {
            this.loading.set(false);
            this.successOrderId.set(order.id);
            this.pendingPaymentRef.set(ref);
            this.pendingInstructions.set(
              payment?.instructions ||
                'Confirmez le paiement dans votre wallet puis cliquez sur "Vérifier le paiement".',
            );
            this.startVerifyPolling(ref);
            return;
          }
          this.api.post('/payments/verify', { providerTransactionId: ref }).subscribe({
            next: () => {
              this.loading.set(false);
              this.success.set(true);
              this.successOrderId.set(order.id);
              this.successPaymentRef.set(ref);
              this.clearCheckoutSelection();
            },
            error: (err: { error?: { message?: string } }) => {
              this.loading.set(false);
              this.error.set(err?.error?.message || 'Paiement initié mais non confirmé automatiquement.');
            },
          });
        },
        error: (err: { error?: { message?: string }; message?: string }) => {
          this.loading.set(false);
          this.error.set(err?.error?.message || err?.message || 'Erreur lors du paiement');
        },
      });
  }

  verifyPendingPayment(): void {
    const ref = String(this.pendingPaymentRef() || '').trim();
    if (!ref) return;
    this.loading.set(true);
    this.api.post('/payments/verify', { providerTransactionId: ref }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.successPaymentRef.set(ref);
        this.pendingPaymentRef.set(null);
        this.pendingInstructions.set(null);
        this.pendingInfo.set(null);
        this.clearCheckoutSelection();
        this.verifyPollingSub?.unsubscribe();
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.pendingInfo.set(err?.error?.message || 'Paiement encore en attente de confirmation opérateur.');
      },
    });
  }

  updateQuantity(item: ShopCartItem, qtyRaw: string): void {
    const qty = Math.max(1, Number(qtyRaw || 1));
    this.shopCartService.updateItem(item.id, qty).subscribe({
      next: () => this.loadCheckoutCart(),
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message || 'Impossible de mettre à jour la quantité.');
      },
    });
  }

  removeItem(item: ShopCartItem): void {
    this.shopCartService.removeItem(item.id).subscribe({
      next: () => {
        this.checkoutSelection = this.checkoutSelection.filter((id) => id !== item.id);
        this.persistSelection();
        this.loadCheckoutCart();
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message || 'Impossible de retirer cet article.');
      },
    });
  }

  closeSuccess(): void {
    void this.router.navigate(['/']);
  }

  getItemImage(item: ShopCartItem): string | null {
    if (!item?.image) return null;
    return buildMediaUrl(String(item.image));
  }

  getQuantityOptions(item: ShopCartItem): number[] {
    const max = Math.min(20, Math.max(1, Number((item as unknown as Record<string, unknown>)['stock'] ?? item.quantity ?? 1)));
    return Array.from({ length: max }, (_, i) => i + 1);
  }

  private loadRelayPoints(): void {
    this.relayPointsLoading.set(true);
    this.api.get<RelayPoint[]>('/cshop/relay-points').subscribe({
      next: (pts) => {
        this.relayPoints.set(pts ?? []);
        this.relayPointsLoading.set(false);
      },
      error: () => {
        this.relayPoints.set([]);
        this.relayPointsLoading.set(false);
      },
    });
  }

  private loadCheckoutCart(): void {
    this.checkoutSelection = this.readSelection();
    this.shopCartService.getCart().subscribe({
      next: (cart) => {
        const selectedIds = this.checkoutSelection.length
          ? this.checkoutSelection
          : cart.items.map((i) => i.id);
        const items = cart.items.filter((i) => selectedIds.includes(i.id));
        this.checkoutSelection = items.map((i) => i.id);
        this.checkoutItems.set(items);
        if (this.checkoutSelection.length > 0) this.persistSelection();
        else this.clearCheckoutSelection();
      },
      error: (err: { error?: { message?: string } }) => {
        this.checkoutItems.set([]);
        this.checkoutSelection = [];
        this.error.set(err?.error?.message || 'Impossible de charger le panier.');
      },
    });
  }

  private handleStripeReturn(params: Record<string, string>): void {
    const status = String(params['status'] || '').toLowerCase();
    const sessionId = String(params['session_id'] || '').trim();
    if (status === 'cancel') {
      this.error.set('Paiement annulé. Vous pouvez reprendre le checkout.');
      return;
    }
    if (status !== 'success' || !sessionId) return;
    this.loading.set(true);
    this.api.post('/payments/verify', { providerTransactionId: sessionId }).subscribe({
      next: () => {
        this.loading.set(false);
        this.success.set(true);
        this.successPaymentRef.set(sessionId);
        this.clearCheckoutSelection();
        void this.router.navigate([], {
          relativeTo: this.route,
          queryParams: {},
          replaceUrl: true,
        });
      },
      error: (err: { error?: { message?: string } }) => {
        this.loading.set(false);
        this.error.set(err?.error?.message || 'Retour Stripe détecté, mais validation impossible.');
      },
    });
  }

  private startVerifyPolling(ref: string): void {
    this.verifyPollingSub?.unsubscribe();
    this.verifyPollingSub = timer(6000, 7000)
      .pipe(switchMap(() => this.api.post('/payments/verify', { providerTransactionId: ref })))
      .subscribe({
        next: () => {
          this.success.set(true);
          this.successPaymentRef.set(ref);
          this.pendingPaymentRef.set(null);
          this.pendingInstructions.set(null);
          this.pendingInfo.set(null);
          this.clearCheckoutSelection();
          this.verifyPollingSub?.unsubscribe();
        },
        error: () => { /* encore en attente */ },
      });
  }

  private isMobileMoney(provider: string): boolean {
    return provider === 'orange_money' || provider === 'mtn_momo' || provider === 'wave';
  }

  private readSelection(): string[] {
    const raw = sessionStorage.getItem(this.checkoutSelectionKey);
    if (!raw) return [];
    try {
      const parsed: unknown = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map(String) : [];
    } catch {
      return [];
    }
  }

  private persistSelection(): void {
    sessionStorage.setItem(this.checkoutSelectionKey, JSON.stringify(this.checkoutSelection));
  }

  private clearCheckoutSelection(): void {
    this.checkoutSelection = [];
    sessionStorage.removeItem(this.checkoutSelectionKey);
  }
}
