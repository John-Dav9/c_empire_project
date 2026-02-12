import { Component, OnInit } from '@angular/core';
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
import { MatStepperModule } from '@angular/material/stepper';
import { forkJoin, of, switchMap, throwError } from 'rxjs';
import { ApiService } from '../../../core/services/api.service';

interface PaymentMethod {
  id: string;
  name: string;
  icon: string;
  description: string;
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
    MatStepperModule,
    RouterLink
  ],
  templateUrl: './payment.component.html',
  styleUrl: './payment.component.scss'
})
export class PaymentComponent implements OnInit {
  formGroup: FormGroup;
  billingForm: FormGroup;
  amount = 0;
  cartItems = 0;
  loading = false;
  error: string | null = null;
  success = false;

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
    private router: Router
  ) {
    this.formGroup = this.fb.group({
      method: ['', Validators.required]
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
      this.amount = params['amount'] || 0;
      const cart = JSON.parse(localStorage.getItem('cart') || '[]');
      this.cartItems = cart.reduce((sum: number, item: any) => sum + item.quantity, 0);
    });
  }

  selectPaymentMethod(methodId: string): void {
    this.formGroup.patchValue({ method: methodId });
  }

  submitPayment(): void {
    if (this.billingForm.invalid || !this.formGroup.value.method) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    if (!Array.isArray(cart) || cart.length === 0) {
      this.error = 'Le panier est vide.';
      return;
    }

    this.loading = true;
    this.error = null;

    const checkoutData = {
      deliveryAddress: `${this.billingForm.value.address}, ${this.billingForm.value.city}`,
      note: `Contact: ${this.billingForm.value.phone}`,
      deliveryOption: 'other',
    };

    const syncCartRequests = cart.map((item: any) =>
      this.api.post('/cshop/cart/add', {
        productId: item.id,
        productName: item.name,
        unitPrice: Number(item.price),
        quantity: Number(item.quantity),
      }),
    );

    this.api.delete('/cshop/cart/clear').pipe(
      switchMap(() => (syncCartRequests.length ? forkJoin(syncCartRequests) : of([]))),
      switchMap(() => this.api.post<any>('/cshop/orders/checkout', checkoutData)),
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

        return this.api.post<any>('/payments/init', paymentData);
      }),
    ).subscribe({
      next: (payment) => {
        this.loading = false;

        if (payment?.redirectUrl) {
          window.location.href = payment.redirectUrl;
          return;
        }

        localStorage.removeItem('cart');
        this.success = true;
        setTimeout(() => {
          this.router.navigate(['/']);
        }, 2000);
      },
      error: (err) => {
        this.loading = false;
        this.error = err?.error?.message || err?.message || 'Erreur lors du paiement';
      }
    });
  }
}
