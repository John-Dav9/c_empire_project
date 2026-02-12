import { Component, OnInit } from '@angular/core';
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
  ],
  template: `
    <mat-toolbar class="toolbar app-shell-card">
      <button mat-icon-button class="menu-btn" (click)="sidenav.toggle()">
        <mat-icon>menu</mat-icon>
      </button>

      <a class="brand" routerLink="/">
        <span class="brand-dot"></span>
        <span>C'EMPIRE</span>
      </a>

      <nav class="top-nav">
        <a *ngFor="let link of navLinks" [routerLink]="link.route">
          {{ link.label }}
        </a>
      </nav>

      <div *ngIf="currentUser$ | async as user" class="user-menu">
        <span class="user-email">{{ user.email }}</span>
        <button mat-icon-button [matMenuTriggerFor]="menu">
          <mat-icon>account_circle</mat-icon>
        </button>
        <mat-menu #menu="matMenu">
          <button mat-menu-item routerLink="/profile">
            <mat-icon>person</mat-icon>
            <span>Profil</span>
          </button>
          <button *ngIf="isAdmin(user)" mat-menu-item routerLink="/admin">
            <mat-icon>admin_panel_settings</mat-icon>
            <span>Administration</span>
          </button>
          <button mat-menu-item (click)="logout()">
            <mat-icon>logout</mat-icon>
            <span>Déconnexion</span>
          </button>
        </mat-menu>
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
            routerLink="/admin"
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
      }

      .menu-btn {
        border: 1px solid var(--line);
        border-radius: 12px;
        background: var(--surface);
      }

      .brand {
        display: inline-flex;
        align-items: center;
        gap: 10px;
        padding: 8px 14px;
        border-radius: 999px;
        text-decoration: none;
        font-size: 1.1rem;
        font-weight: 700;
        background: linear-gradient(
          135deg,
          rgba(208, 90, 45, 0.16),
          rgba(15, 138, 119, 0.18)
        );
      }

      .brand-dot {
        width: 10px;
        height: 10px;
        border-radius: 999px;
        background: var(--brand);
        box-shadow: 0 0 0 5px rgba(208, 90, 45, 0.25);
      }

      .top-nav {
        display: flex;
        gap: 6px;
        flex: 1;
        overflow-x: auto;
        scrollbar-width: none;
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

      .user-menu {
        display: inline-flex;
        align-items: center;
        gap: 6px;
      }

      .user-email {
        max-width: 190px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
        color: var(--ink-2);
        font-size: 0.85rem;
      }

      .sidenav-container {
        min-height: calc(100vh - 90px);
        background: transparent;
      }

      .sidenav {
        width: 280px;
        padding: 10px 6px;
        background: #fff9ef;
        border-right: 1px solid var(--line);
      }

      .content {
        padding: 20px 18px 34px;
      }

      @media (max-width: 940px) {
        .top-nav {
          display: none;
        }

        .user-email {
          display: none;
        }
      }
    `,
  ],
})
export class LayoutComponent implements OnInit {
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

  ngOnInit(): void {
    if (!this.authService.isAuthenticated()) {
      this.router.navigate(['/auth/signin']);
    }
  }

  isAdmin(user: User | null): boolean {
    if (!user) return false;
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
