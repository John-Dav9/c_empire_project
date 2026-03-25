import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-success',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="success-container">
      <div class="success-card">
        <div class="icon-wrapper">
          <mat-icon class="success-icon">check_circle</mat-icon>
        </div>
        <h1 class="title">Paiement confirmé !</h1>
        <p class="subtitle">
          Votre paiement a été traité avec succès.
          @if (reference()) {
            <br>Référence : <strong>{{ reference() }}</strong>
          }
        </p>
        <p class="info">
          Vous recevrez une confirmation par e-mail dans quelques instants.
        </p>
        <div class="actions">
          <a mat-flat-button routerLink="/client/dashboard" class="dashboard-btn">
            <mat-icon>dashboard</mat-icon>
            Voir mes commandes
          </a>
          <a mat-stroked-button routerLink="/">
            <mat-icon>home</mat-icon>
            Retour à l'accueil
          </a>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .success-container {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #f0fdf4 0%, #fff 100%);
    }
    .success-card {
      background: white;
      border-radius: 16px;
      padding: 3rem 2.5rem;
      max-width: 480px;
      width: 100%;
      text-align: center;
      box-shadow: 0 8px 40px rgba(0,0,0,0.08);
    }
    .icon-wrapper {
      margin-bottom: 1.5rem;
    }
    .success-icon {
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      color: #2e7d32;
    }
    .title {
      font-size: 1.75rem;
      font-weight: 700;
      color: #1a1a2e;
      margin: 0 0 1rem;
    }
    .subtitle {
      color: #444;
      margin-bottom: 0.75rem;
      line-height: 1.6;
    }
    .info {
      color: #888;
      font-size: 0.9rem;
      margin-bottom: 2rem;
    }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .dashboard-btn {
      background-color: #2e7d32;
      color: white;
    }
    @media (max-width: 480px) {
      .success-container { padding: 1rem; }
      .success-card { padding: 2rem 1.25rem; }
      .title { font-size: 1.4rem; }
      .success-icon { font-size: 3.5rem; width: 3.5rem; height: 3.5rem; }
    }
  `]
})
export class PaymentSuccessComponent implements OnInit {
  private readonly route = inject(ActivatedRoute);
  readonly reference = signal<string | null>(null);

  ngOnInit(): void {
    const ref = this.route.snapshot.queryParamMap.get('ref')
      ?? this.route.snapshot.queryParamMap.get('reference');
    this.reference.set(ref);
  }
}
