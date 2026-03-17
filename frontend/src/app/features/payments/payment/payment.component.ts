import { ChangeDetectorRef, Component, NgZone, OnDestroy, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subscription, forkJoin, map, of, switchMap, throwError, timer } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';
import { buildMediaUrl } from '../../../core/config/api.config';
import { ShopCartItem, ShopCartService } from '../../../core/services/shop-cart.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
}

interface DeliveryOption {
  id: 'other' | 'cexpress';
  name: string;
  description: string;
  badge?: string;
}

interface PromoValidationResponse {
  valid: boolean;
  code?: string;
  title?: string;
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
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatSelectModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    RouterLink
  ],
  templateUrl: './payment.component.html',
  styleUrls: ['./payment.component.scss']
})
export class PaymentComponent implements OnInit, OnDestroy {
  // Form principal (moyen de paiement + option de livraison).
  formGroup: FormGroup;
  // Form de facturation/contact utilisé au moment de confirmer la commande.
  billingForm: FormGroup;
  amount = 0;
  cartSubtotal = 0;
  cartItems = 0;
  promoCode = '';
  promoDiscount = 0;
  promoMessage: string | null = null;
  promoAppliedCode: string | null = null;
  promoChecking = false;
  loading = false;
  error: string | null = null;
  success = false;
  successOrderId: string | null = null;
  successPaymentRef: string | null = null;
  pendingPaymentRef: string | null = null;
  pendingInstructions: string | null = null;
  pendingInfo: string | null = null;
  readonly standardDeliveryFee = 5000;
  readonly cexpressDeliveryFee = 7500;
  checkoutItems: ShopCartItem[] = [];
  private readonly checkoutSelectionKey = 'checkoutCartItemIds';
  private checkoutSelection: string[] = [];
  private verifyPollingSub?: Subscription;
  deliveryOptions: DeliveryOption[] = [
    {
      id: 'other',
      name: 'Livraison standard',
      description: 'Mode classique sans tarification C\'Express.',
    },
    {
      id: 'cexpress',
      name: 'C\'Express',
      description: 'Livraison prioritaire avec frais calcules au checkout.',
      badge: 'Rapide',
    },
  ];

  paymentMethods: PaymentMethod[] = [
    {
      id: 'orange_money',
      name: 'Orange Money',
      icon: 'payments',
      description: 'Paiement par Orange Money'
    },
    {
      id: 'mtn_momo',
      name: 'MTN Momo',
      icon: 'phone',
      description: 'Paiement par MTN Mobile Money'
    },
    {
      id: 'wave',
      name: 'Wave',
      icon: 'account_balance_wallet',
      description: 'Paiement par Wave'
    },
    {
      id: 'stripe',
      name: 'Carte Bancaire',
      icon: 'credit_card',
      description: 'Paiement par carte bancaire'
    }
  ];

  constructor(
    private fb: FormBuilder,
    private api: ApiService,
    private route: ActivatedRoute,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private shopCartService: ShopCartService,
  ) {
    this.formGroup = this.fb.group({
      method: ['', Validators.required],
      deliveryOption: ['other', Validators.required],
    });

    this.billingForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      phone: ['', Validators.required],
      address: ['', Validators.required],
      city: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      this.loadCheckoutCart();
      this.handleStripeReturn(params);
    });
  }

  ngOnDestroy(): void {
    this.stopVerifyPolling();
  }

  selectPaymentMethod(methodId: string): void {
    // Sélection visuelle et valeur de form synchronisées.
    this.formGroup.patchValue({ method: methodId });
  }

  selectDeliveryOption(option: DeliveryOption['id']): void {
    // Impacte instantanément les frais/total.
    this.formGroup.patchValue({ deliveryOption: option });
    this.recomputeAmount();
  }

  applyPromoCode(): void {
    // Prévisualisation locale de remise avant checkout final.
    const code = this.promoCode.trim();
    if (!code) {
      this.resetPromoPreview();
      this.promoMessage = null;
      return;
    }

    const items = this.checkoutItems;
    const subtotal = items.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
      0,
    );

    if (subtotal <= 0) {
      this.resetPromoPreview();
      this.promoMessage = 'Panier vide: impossible de calculer la remise.';
      return;
    }

    this.promoChecking = true;
    this.api.get<PromoValidationResponse>(`/cshop/promotions/public/code/${encodeURIComponent(code)}`).subscribe({
      next: (promo) => {
        this.promoChecking = false;
        if (!promo?.valid || !promo.productIds?.length || !promo.type || !promo.value) {
          this.resetPromoPreview();
          this.promoMessage = 'Code promo invalide ou expiré.';
          return;
        }

        const eligibleSubtotal = items.reduce((sum: number, item: any) => {
          if (!promo.productIds!.includes(item.id)) return sum;
          return sum + Number(item.price) * Number(item.quantity);
        }, 0);

        if (eligibleSubtotal <= 0) {
          this.resetPromoPreview();
          this.promoMessage = "Ce code promo ne s'applique à aucun article du panier.";
          return;
        }

        const rawDiscount =
          promo.type === 'percent'
            ? (eligibleSubtotal * Number(promo.value)) / 100
            : Number(promo.value);
        this.promoDiscount = Math.max(0, Math.min(rawDiscount, eligibleSubtotal));
        this.promoAppliedCode = promo.code || code.toUpperCase();
        this.promoMessage = `Code ${this.promoAppliedCode} appliqué (${this.promoDiscount.toLocaleString('fr-FR')} XAF).`;
      },
      error: () => {
        this.promoChecking = false;
        this.resetPromoPreview();
        this.promoMessage = 'Impossible de vérifier le code promo.';
      }
    });
  }

  submitPayment(): void {
    if (this.billingForm.invalid || !this.formGroup.value.method) return;
    const selectedItems = this.checkoutItems;
    if (!selectedItems.length) {
      this.error = 'Le panier est vide.';
      return;
    }

    this.loading = true;
    this.error = null;
    this.pendingInfo = null;

    const checkoutData = {
      deliveryAddress: `${this.billingForm.value.address}, ${this.billingForm.value.city}`,
      note: `Contact: ${this.billingForm.value.phone}`,
      deliveryOption: this.formGroup.value.deliveryOption || 'other',
      promoCode: this.promoCode.trim() || undefined,
      cartItemIds: this.checkoutSelection,
    };

    this.api.post<any>('/cshop/orders/checkout', checkoutData).pipe(
      switchMap((order) => {
        if (!order?.id) {
          return throwError(() => new Error('Impossible de créer la commande.'));
        }

        const paymentData = {
          referenceType: 'shop_order',
          referenceId: order.id,
          currency: 'XAF',
          provider: this.formGroup.value.method,
          metadata: {
            billingInfo: this.billingForm.value,
          },
        };

        return this.api.post<InitPaymentResponse>('/payments/init', paymentData).pipe(
          map((payment) => ({ order, payment })),
        );
      }),
    ).subscribe({
      next: ({ order, payment }) => {
        if (payment?.redirectUrl) {
          this.loading = false;
          this.successOrderId = order?.id || null;
          this.successPaymentRef =
            payment?.providerTransactionId || payment?.paymentId || null;
          this.cdr.detectChanges();
          window.location.href = payment.redirectUrl;
          return;
        }

        const providerTransactionId = String(
          payment?.providerTransactionId || '',
        ).trim();
        if (!providerTransactionId) {
          this.loading = false;
          this.error =
            'Paiement initialisé, mais confirmation impossible (référence absente).';
          return;
        }

        const providerId = String(payment?.provider || this.formGroup.value.method || '');
        if (this.isMobileMoneyProvider(providerId)) {
          this.loading = false;
          this.successOrderId = order?.id || null;
          this.pendingPaymentRef = providerTransactionId;
          this.pendingInstructions =
            payment?.instructions ||
            'Confirmez le paiement dans votre wallet puis cliquez sur "Vérifier le paiement".';
          this.startVerifyPolling(providerTransactionId);
          this.cdr.detectChanges();
          return;
        }

        this.api
          .post('/payments/verify', {
            providerTransactionId,
          })
          .subscribe({
            next: () => {
              this.zone.run(() => {
                this.loading = false;
                this.successOrderId = order?.id || null;
                this.successPaymentRef = providerTransactionId;
                this.clearCheckoutSelection();
                this.success = true;
                this.cdr.detectChanges();
              });
            },
            error: (verifyErr) => {
              this.zone.run(() => {
                this.loading = false;
                this.error =
                  verifyErr?.error?.message ||
                  'Paiement initié mais non confirmé automatiquement.';
                this.cdr.detectChanges();
              });
            },
          });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.error = err?.error?.message || err?.message || 'Erreur lors du paiement';
          this.cdr.detectChanges();
        });
      }
    });
  }

  verifyPendingPayment(): void {
    const ref = String(this.pendingPaymentRef || '').trim();
    if (!ref) return;
    this.loading = true;
    this.api
      .post('/payments/verify', { providerTransactionId: ref })
      .subscribe({
        next: () => {
          this.loading = false;
          this.success = true;
          this.successPaymentRef = ref;
          this.pendingPaymentRef = null;
          this.pendingInstructions = null;
          this.pendingInfo = null;
          this.clearCheckoutSelection();
          this.stopVerifyPolling();
          this.cdr.detectChanges();
        },
        error: (err) => {
          this.loading = false;
          this.pendingInfo =
            err?.error?.message ||
            'Paiement encore en attente de confirmation opérateur.';
          this.cdr.detectChanges();
        },
      });
  }

  get totalAfterPromo(): number {
    // Total simulé côté UI (sans dépasser 0).
    return Math.max(0, Number(this.amount) - Number(this.promoDiscount || 0));
  }

  get deliveryFee(): number {
    // Barème livraison simplifié.
    return this.formGroup.value.deliveryOption === 'cexpress'
      ? this.cexpressDeliveryFee
      : this.standardDeliveryFee;
  }

  closeSuccess(): void {
    this.router.navigate(['/']);
  }

  updateQuantity(item: any, qtyRaw: string): void {
    const qty = Math.max(1, Number(qtyRaw || 1));
    this.shopCartService.updateItem(item.id, qty).subscribe({
      next: () => this.loadCheckoutCart(),
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de mettre à jour la quantité.';
      },
    });
  }

  removeItem(item: any): void {
    this.shopCartService.removeItem(item.id).subscribe({
      next: () => {
        this.checkoutSelection = this.checkoutSelection.filter((id) => id !== item.id);
        this.persistSelection();
        this.loadCheckoutCart();
      },
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de retirer cet article.';
      },
    });
  }

  getCheckoutQuantityOptions(item: any): number[] {
    const max = Math.min(20, Math.max(1, Number(item?.stock || item?.quantity || 1)));
    return Array.from({ length: max }, (_, idx) => idx + 1);
  }

  getItemImage(item: ShopCartItem): string | null {
    const raw = item?.image;
    if (!raw) return null;
    return buildMediaUrl(String(raw));
  }

  private resetPromoPreview(): void {
    this.promoDiscount = 0;
    this.promoAppliedCode = null;
  }

  private recomputeCartStats(): void {
    this.cartSubtotal = this.checkoutItems.reduce(
      (sum: number, item: any) => sum + Number(item.price) * Number(item.quantity),
      0,
    );
    this.cartItems = this.checkoutItems.reduce(
      (sum: number, item: any) => sum + Number(item.quantity || 0),
      0,
    );
    this.recomputeAmount();
  }

  private recomputeAmount(): void {
    // Recalcule la base de paiement (hors remise promo).
    this.amount = Number(this.cartSubtotal || 0) + Number(this.deliveryFee);
  }

  private handleStripeReturn(params: Record<string, any>): void {
    const status = String(params['status'] || '').toLowerCase();
    const sessionId = String(params['session_id'] || '').trim();

    if (status === 'cancel') {
      this.error = 'Paiement annulé. Vous pouvez reprendre le checkout.';
      return;
    }

    if (status !== 'success' || !sessionId) {
      return;
    }

    this.loading = true;
    this.api
      .post('/payments/verify', { providerTransactionId: sessionId })
      .subscribe({
        next: () => {
          this.zone.run(() => {
            this.loading = false;
            this.success = true;
            this.successPaymentRef = sessionId;
            this.clearCheckoutSelection();
            this.cdr.detectChanges();
            void this.router.navigate([], {
              relativeTo: this.route,
              queryParams: {},
              replaceUrl: true,
            });
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.loading = false;
            this.error =
              err?.error?.message ||
              'Retour Stripe détecté, mais validation du paiement impossible.';
            this.cdr.detectChanges();
          });
        },
      });
  }

  private startVerifyPolling(providerTransactionId: string): void {
    this.stopVerifyPolling();
    this.verifyPollingSub = timer(6000, 7000)
      .pipe(
        switchMap(() =>
          this.api.post('/payments/verify', { providerTransactionId }),
        ),
      )
      .subscribe({
        next: () => {
          this.success = true;
          this.successPaymentRef = providerTransactionId;
          this.pendingPaymentRef = null;
          this.pendingInstructions = null;
          this.pendingInfo = null;
          this.clearCheckoutSelection();
          this.stopVerifyPolling();
          this.cdr.detectChanges();
        },
        error: () => {
          // Le provider peut rester en PENDING plusieurs cycles.
        },
      });
  }

  private stopVerifyPolling(): void {
    this.verifyPollingSub?.unsubscribe();
    this.verifyPollingSub = undefined;
  }

  private isMobileMoneyProvider(provider: string): boolean {
    return (
      provider === 'orange_money' ||
      provider === 'mtn_momo' ||
      provider === 'wave'
    );
  }

  private loadCheckoutCart(): void {
    this.checkoutSelection = this.readSelection();
    this.shopCartService.getCart().subscribe({
      next: (cart) => {
        const selectedIds = this.checkoutSelection.length
          ? this.checkoutSelection
          : cart.items.map((item) => item.id);
        this.checkoutItems = cart.items.filter((item) => selectedIds.includes(item.id));
        this.checkoutSelection = this.checkoutItems.map((item) => item.id);
        if (this.checkoutSelection.length > 0) {
          this.persistSelection();
        } else {
          this.clearCheckoutSelection();
        }
        this.recomputeCartStats();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.checkoutItems = [];
        this.checkoutSelection = [];
        this.error = err?.error?.message || 'Impossible de charger le panier.';
        this.recomputeCartStats();
        this.cdr.detectChanges();
      },
    });
  }

  private readSelection(): string[] {
    const raw = sessionStorage.getItem(this.checkoutSelectionKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
    } catch {
      return [];
    }
  }

  private persistSelection(): void {
    sessionStorage.setItem(
      this.checkoutSelectionKey,
      JSON.stringify(this.checkoutSelection),
    );
  }

  private clearCheckoutSelection(): void {
    this.checkoutSelection = [];
    sessionStorage.removeItem(this.checkoutSelectionKey);
  }
}
