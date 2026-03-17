import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-admin-area-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="admin-shell">
      <aside class="admin-sidebar app-shell-card">
        <div class="admin-brand">Admin Space</div>

        <nav class="admin-nav">
          <a routerLink="/admin/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/admin/users" routerLinkActive="active">Utilisateurs</a>
          <a routerLink="/admin/shop/products" routerLinkActive="active">Produits Boutique</a>
          <a routerLink="/admin/shop/promotions" routerLinkActive="active">Promotions Boutique</a>
          <a routerLink="/admin/events/catalog" routerLinkActive="active">C'Events Catalogues</a>
          <a routerLink="/admin/events/bookings" routerLinkActive="active">C'Events Réservations</a>
          <a routerLink="/admin/express/deliveries" routerLinkActive="active">C'Express Livraisons</a>
          <a routerLink="/admin/express/couriers" routerLinkActive="active">C'Express Couriers</a>
          <a routerLink="/admin/express/import-export" routerLinkActive="active">C'Express Import/Export</a>
          <a routerLink="/admin/marketing/pages" routerLinkActive="active">Pages institutionnelles</a>
        </nav>

        <button class="logout-btn" type="button" (click)="logout()">
          Deconnexion
        </button>
      </aside>

      <main class="admin-content page-enter">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .admin-shell {
        display: grid;
        grid-template-columns: 240px 1fr;
        gap: 14px;
        min-height: calc(100vh - 118px);
      }

      .admin-sidebar {
        padding: 14px;
        border: 1px solid var(--line);
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 12px;
      }

      .admin-brand {
        font-weight: 800;
        color: var(--ink-0);
      }

      .admin-nav {
        display: grid;
        gap: 6px;
      }

      .admin-nav a {
        text-decoration: none;
        color: var(--ink-1);
        border-radius: 10px;
        padding: 9px 10px;
        border: 1px solid transparent;
      }

      .admin-nav a.active {
        color: var(--ink-0);
        background: rgba(208, 90, 45, 0.14);
        border-color: rgba(208, 90, 45, 0.3);
      }

      .logout-btn {
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #fff;
        padding: 9px 10px;
        cursor: pointer;
      }

      .admin-content {
        min-width: 0;
      }

      @media (max-width: 940px) {
        .admin-shell {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class AdminAreaLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
