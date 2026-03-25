import { ChangeDetectionStrategy, Component } from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-not-found',
  imports: [RouterLink, MatButtonModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="not-found-container">
      <div class="not-found-content">
        <span class="error-code">404</span>
        <h1 class="title">Page introuvable</h1>
        <p class="subtitle">
          La page que vous recherchez n'existe pas ou a été déplacée.
        </p>
        <div class="actions">
          <a mat-flat-button routerLink="/" class="home-btn">
            <mat-icon>home</mat-icon>
            Retour à l'accueil
          </a>
          <button mat-stroked-button onclick="history.back()">
            <mat-icon>arrow_back</mat-icon>
            Page précédente
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .not-found-container {
      min-height: 70vh;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    .not-found-content {
      max-width: 480px;
    }
    .error-code {
      display: block;
      font-size: 8rem;
      font-weight: 900;
      line-height: 1;
      color: #e0e0e0;
      letter-spacing: -4px;
    }
    .title {
      font-size: 1.75rem;
      font-weight: 600;
      margin: 0.5rem 0 1rem;
      color: #1a1a2e;
    }
    .subtitle {
      color: #666;
      margin-bottom: 2rem;
      line-height: 1.6;
    }
    .actions {
      display: flex;
      gap: 1rem;
      justify-content: center;
      flex-wrap: wrap;
    }
    .home-btn {
      background-color: #c62828;
      color: white;
    }
  `]
})
export class NotFoundComponent {}
