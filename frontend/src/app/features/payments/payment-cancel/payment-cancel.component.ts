import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-payment-cancel',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="cancel-container">
      <div class="cancel-card">
        <div class="icon-wrapper">
          <mat-icon class="cancel-icon">cancel</mat-icon>
        </div>
        <h1 class="title">Paiement annulé</h1>
        <p class="subtitle">
          Votre paiement a été annulé. Aucun montant n'a été débité.
        </p>
        <p class="info">
          Si vous avez rencontré un problème, n'hésitez pas à réessayer ou à nous contacter.
        </p>
        <div class="actions">
          <a mat-flat-button routerLink="/payments/checkout" class="retry-btn">
            <mat-icon>refresh</mat-icon>
            Réessayer le paiement
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
    .cancel-container {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      background: linear-gradient(135deg, #fff5f5 0%, #fff 100%);
    }
    .cancel-card {
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
    .cancel-icon {
      font-size: 5rem;
      width: 5rem;
      height: 5rem;
      color: #c62828;
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
    .retry-btn {
      background-color: #c62828;
      color: white;
    }
  `]
})
export class PaymentCancelComponent {}
