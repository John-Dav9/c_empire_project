import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { Observable } from 'rxjs';
import { UserRole } from '../../features/admin/models/admin.models';
import { SiteFooterComponent } from '../footer/site-footer.component';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    RouterLink,
    RouterOutlet,
    SiteFooterComponent,
  ],
  template: `
    <mat-toolbar class="toolbar app-shell-card">
      <div class="toolbar-left">
        <a class="brand" routerLink="/">
          <img
            class="brand-logo"
            src="/media/logos/cempire-log.jpg"
            alt="Logo C'EMPIRE"
          />
          <span class="brand-name">C'EMPIRE</span>
        </a>

        <nav class="top-nav">
          <a *ngFor="let link of navLinks" [routerLink]="link.route">
            {{ link.label }}
          </a>
        </nav>
      </div>

      <div class="toolbar-right">
        <a
          class="cart-chip"
          mat-stroked-button
          [routerLink]="['/shop/cart']"
          aria-label="Aller au panier"
        >
          <mat-icon>shopping_cart</mat-icon>
          <span class="cart-label">Panier</span>
        </a>

        <ng-container *ngIf="currentUser$ | async as user; else guestProfile">
          <a
            *ngIf="isAdmin(user)"
            class="admin-chip"
            mat-stroked-button
            [routerLink]="getAdminRoute(user)"
          >
            Admin
          </a>

          <button class="profile-chip" mat-button [matMenuTriggerFor]="menu">
            <span class="profile-name">{{ getUserLabel(user) }}</span>
            <mat-icon>account_circle</mat-icon>
          </button>
          <mat-menu #menu="matMenu">
            <button mat-menu-item routerLink="/profile">
              <mat-icon>person</mat-icon>
              <span>Profil</span>
            </button>
            <button
              *ngIf="isAdmin(user)"
              mat-menu-item
              [routerLink]="getAdminRoute(user)"
            >
              <mat-icon>admin_panel_settings</mat-icon>
              <span>Administration</span>
            </button>
            <button mat-menu-item (click)="logout()">
              <mat-icon>logout</mat-icon>
              <span>Déconnexion</span>
            </button>
          </mat-menu>
        </ng-container>

        <ng-template #guestProfile>
          <a class="profile-chip" mat-button [routerLink]="['/auth/signin']">
            <span class="profile-name">Connexion</span>
            <mat-icon>account_circle</mat-icon>
          </a>
        </ng-template>

        <button
          mat-icon-button
          class="menu-btn mobile-only"
          (click)="sidenav.toggle()"
          aria-label="Ouvrir le menu"
        >
          <mat-icon>menu</mat-icon>
        </button>
      </div>
    </mat-toolbar>

    <mat-sidenav-container class="sidenav-container">
      <mat-sidenav #sidenav mode="over" class="sidenav">
        <mat-nav-list>
          <a
            mat-list-item
            *ngFor="let link of navLinks"
            [routerLink]="link.route"
            (click)="sidenav.close()"
          >
            <mat-icon matListItemIcon>{{ link.icon }}</mat-icon>
            <span matListItemTitle>{{ link.label }}</span>
          </a>
          <a
            mat-list-item
            *ngIf="(currentUser$ | async) && isAdmin((currentUser$ | async)!)"
            [routerLink]="getAdminRoute((currentUser$ | async)!)"
            (click)="sidenav.close()"
          >
            <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
            <span matListItemTitle>Administration</span>
          </a>
        </mat-nav-list>
      </mat-sidenav>

      <mat-sidenav-content>
        <main class="content page-enter">
          <router-outlet></router-outlet>
        </main>
        <app-site-footer></app-site-footer>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: [
    `
      .toolbar {
        position: sticky;
        top: 14px;
        z-index: 90;
        margin: 14px;
        padding: 0 12px;
        height: 70px;
        border-radius: 18px;
        display: flex;
        gap: 12px;
        color: var(--ink-0);
        border: 1px solid var(--line);
        justify-content: space-between;
      }

      .toolbar-left {
        display: flex;
        align-items: center;
        gap: 14px;
        min-width: 0;
        flex: 1;
      }

      .menu-btn {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--surface);
      }

      .mobile-only {
        display: none;
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        padding: 7px 12px;
        margin-right: 8px;
        border-radius: 999px;
        text-decoration: none;
        font-size: 1rem;
        font-weight: 700;
        background: linear-gradient(
          135deg,
          rgba(30, 110, 231, 0.15),
          rgba(18, 164, 166, 0.16)
        );
        border: 1px solid rgba(34, 86, 155, 0.16);
      }

      .brand-logo {
        width: auto;
        height: 28px;
        object-fit: contain;
        border-radius: 8px;
      }

      .brand-name {
        white-space: nowrap;
      }

      .top-nav {
        display: flex;
        gap: 6px;
        flex: 1;
        overflow-x: auto;
        scrollbar-width: none;
        padding-left: 12px;
        border-left: 1px solid rgba(72, 109, 151, 0.2);
      }

      .top-nav::-webkit-scrollbar {
        display: none;
      }

      .top-nav a {
        text-decoration: none;
        white-space: nowrap;
        color: var(--ink-1);
        font-weight: 600;
        font-size: 0.9rem;
        padding: 9px 12px;
        border-radius: 999px;
        transition: all 0.2s ease;
      }

      .top-nav a:hover {
        background: var(--surface-soft);
        color: var(--ink-0);
        transform: translateY(-1px);
      }

      .toolbar-right {
        display: inline-flex;
        align-items: center;
        gap: 8px;
        margin-left: 10px;
        flex-shrink: 0;
      }

      .admin-chip {
        height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(18, 164, 166, 0.4);
        color: #0d7f80;
        background: rgba(18, 164, 166, 0.1);
        font-weight: 700;
        padding: 0 14px;
      }

      .cart-chip {
        height: 42px;
        border-radius: 999px;
        border: 1px solid rgba(30, 110, 231, 0.33);
        color: var(--brand-strong);
        background: rgba(30, 110, 231, 0.08);
        font-weight: 700;
        padding: 0 12px;
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .profile-chip {
        height: 42px;
        border: 1px solid var(--line);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.75);
        padding: 0 10px 0 14px;
        display: inline-flex;
        align-items: center;
        gap: 8px;
        color: var(--ink-0);
      }

      .profile-name {
        max-width: 180px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ink-1);
        font-size: 0.9rem;
        font-weight: 600;
      }

      .sidenav-container {
        min-height: calc(100vh - 90px);
        background: transparent;
      }

      .sidenav {
        width: 280px;
        padding: 10px 6px;
        background: #f7fbff;
        border-right: 1px solid var(--line);
      }

      .content {
        padding: 20px 18px 34px;
      }

      @media (max-width: 940px) {
        .top-nav {
          display: none;
        }

        .brand-name,
        .profile-name {
          display: none;
        }

        .mobile-only {
          display: inline-flex;
        }

        .profile-chip {
          min-width: 42px;
          width: 42px;
          padding: 0;
          justify-content: center;
        }

        .admin-chip {
          display: none;
        }

        .cart-label {
          display: none;
        }

        .cart-chip {
          min-width: 42px;
          width: 42px;
          padding: 0;
          justify-content: center;
        }
      }
    `,
  ],
})
export class LayoutComponent {
  currentUser$: Observable<User | null>;
  readonly navLinks = [
    { route: '/', label: 'Accueil', icon: 'home' },
    { route: '/shop', label: 'Boutique', icon: 'storefront' },
    { route: '/grill', label: 'Grill', icon: 'restaurant' },
    { route: '/express', label: 'Express', icon: 'local_shipping' },
    { route: '/clean', label: 'Clean', icon: 'cleaning_services' },
    { route: '/events', label: 'Events', icon: 'event' },
    { route: '/todo', label: 'Todo', icon: 'checklist' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
  ) {
    this.currentUser$ = this.authService.currentUser$;
  }

  isAdmin(user: User | null): boolean {
    if (!user) return false;
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  getUserLabel(user: User): string {
    const local = user.email?.split('@')[0]?.trim();
    if (local && local.length > 0) {
      return local;
    }
    return 'Mon profil';
  }

  getAdminRoute(user: User): string {
    if (user.role === UserRole.SUPER_ADMIN) {
      return '/super-admin/dashboard';
    }
    return '/admin/dashboard';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
