import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';

type CleanBooking = {
  id: string;
  cleanServiceId: string;
  serviceTitle: string;
  amount: number;
  currency: string;
  fullName: string;
  email: string;
  phone?: string;
  address: string;
  city?: string;
  status: string;
  paymentId?: string;
  paymentProvider?: string;
  paidAt?: string;
};

@Component({
  selector: 'app-clean-booking-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <section class="page page-enter">
      <header class="head app-shell-card">
        <h1>Détail réservation C'Clean</h1>
        <a [routerLink]="['/clean']">Retour services</a>
      </header>

      <p class="alert error" *ngIf="error">{{ error }}</p>
      <p class="alert ok" *ngIf="notice">{{ notice }}</p>

      <section class="card app-shell-card" *ngIf="booking">
        <h2>{{ booking.serviceTitle }}</h2>
        <p><strong>ID:</strong> {{ booking.id }}</p>
        <p><strong>Statut:</strong> {{ booking.status }}</p>
        <p><strong>Montant:</strong> {{ booking.amount | number:'1.0-0' }} {{ booking.currency }}</p>
        <p><strong>Client:</strong> {{ booking.fullName }} ({{ booking.email }})</p>
        <p><strong>Adresse:</strong> {{ booking.address }} {{ booking.city ? ' - ' + booking.city : '' }}</p>
        <p *ngIf="booking.paymentId"><strong>Payment ID:</strong> {{ booking.paymentId }}</p>
        <p *ngIf="booking.paidAt"><strong>Payée le:</strong> {{ booking.paidAt | date:'dd/MM/yyyy HH:mm' }}</p>

        <div class="pay-box" *ngIf="!booking.paymentId">
          <p class="title">Paiement</p>
          <ng-container *ngIf="isAuthenticated; else signinBlock">
            <label>Moyen de paiement</label>
            <select [(ngModel)]="provider" name="provider">
              <option value="mtn_momo">MTN MoMo</option>
              <option value="orange_money">Orange Money</option>
              <option value="wave">Wave</option>
              <option value="card">Carte</option>
              <option value="stripe">Stripe</option>
              <option value="paypal">PayPal</option>
            </select>
            <button type="button" (click)="pay()" [disabled]="paying">
              {{ paying ? 'Initialisation...' : 'Payer cette réservation' }}
            </button>
          </ng-container>
          <ng-template #signinBlock>
            <a class="signin" [routerLink]="['/auth/signin']" [queryParams]="{ returnUrl: currentUrl }">
              Se connecter pour payer
            </a>
          </ng-template>
        </div>
      </section>
    </section>
  `,
  styles: [`
    .page { display:grid; gap:12px; }
    .head { display:flex; justify-content:space-between; align-items:center; gap:10px; border:1px solid var(--line); border-radius:14px; padding:12px; }
    .head h1 { margin:0; font-size:1.4rem; }
    .head a { text-decoration:none; border:1px solid #cfe0f2; border-radius:999px; padding:8px 12px; background:#f4f9ff; color:#245f99; font-weight:700; }
    .card { border:1px solid var(--line); border-radius:14px; padding:14px; display:grid; gap:6px; }
    .card h2 { margin:0 0 4px; }
    .card p { margin:0; color:var(--ink-1); }
    .pay-box { margin-top:8px; border-top:1px solid #dbe7f0; padding-top:10px; display:grid; gap:8px; max-width:380px; }
    .pay-box .title { font-weight:800; color:var(--ink-0); }
    select { height:40px; border:1px solid var(--line); border-radius:10px; padding:0 10px; }
    button, .signin { width:fit-content; text-decoration:none; border:none; border-radius:999px; padding:10px 14px; background:#55a53d; color:#fff; font-weight:800; cursor:pointer; }
    .alert { padding:10px 12px; border-radius:10px; }
    .alert.error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; }
    .alert.ok { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; }
  `],
})
export class CleanBookingDetailComponent implements OnInit {
  booking: CleanBooking | null = null;
  error: string | null = null;
  notice: string | null = null;
  provider = 'mtn_momo';
  paying = false;
  currentUrl = '';

  constructor(
    private readonly route: ActivatedRoute,
    private readonly router: Router,
    private readonly api: ApiService,
    private readonly authService: AuthService,
  ) {}

  get isAuthenticated(): boolean {
    return !!this.authService.getCurrentUser();
  }

  ngOnInit(): void {
    this.currentUrl = this.router.url;
    this.load();
  }

  load(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (!id) {
      this.error = 'Réservation introuvable.';
      return;
    }
    this.api.get<CleanBooking>(`/cclean/bookings/${id}`).subscribe({
      next: (booking) => {
        this.booking = booking;
      },
      error: (err) => {
        this.error = this.extractError(err) || 'Impossible de charger la réservation.';
      },
    });
  }

  pay(): void {
    if (!this.booking) return;
    this.paying = true;
    this.error = null;
    this.notice = null;
    this.api.post<any>(`/cclean/bookings/${this.booking.id}/pay`, { provider: this.provider }).subscribe({
      next: (res) => {
        this.paying = false;
        this.notice = 'Paiement initialisé.';
        const redirectUrl = res?.redirectUrl || res?.payment?.redirectUrl;
        if (redirectUrl) {
          window.location.href = redirectUrl;
        }
      },
      error: (err) => {
        this.paying = false;
        this.error = this.extractError(err) || 'Impossible d’initier le paiement.';
      },
    });
  }

  private extractError(err: any): string {
    const raw = err?.error;
    if (!raw) return '';
    if (typeof raw === 'string') return raw;
    if (Array.isArray(raw?.message)) return raw.message.join(', ');
    return raw?.message || '';
  }
}

