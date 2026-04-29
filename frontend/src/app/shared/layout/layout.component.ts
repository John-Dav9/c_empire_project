import { Component, OnInit, OnDestroy, inject, ChangeDetectionStrategy } from '@angular/core';
import { DatePipe } from '@angular/common';
import { toSignal } from '@angular/core/rxjs-interop';
import { Subscription, interval } from 'rxjs';
import { switchMap, filter } from 'rxjs/operators';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatMenuModule } from '@angular/material/menu';
import { MatBadgeModule } from '@angular/material/badge';
import { RouterLink, RouterOutlet, Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { UserRole } from '../../features/admin/models/admin.models';
import { SiteFooterComponent } from '../footer/site-footer.component';
import { ApiService } from '../../core/services/api.service';

interface AppNotification {
  id: string;
  title: string;
  message: string;
  channel: string;
  isRead: boolean;
  createdAt: string;
}

@Component({
  selector: 'app-layout',
  imports: [
    DatePipe,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatIconModule,
    MatButtonModule,
    MatMenuModule,
    MatBadgeModule,
    RouterLink,
    RouterOutlet,
    SiteFooterComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <!-- ── NAVBAR ── -->
    <mat-toolbar class="navbar">
      <div class="nav-inner">
        <!-- Brand -->
        <a class="brand" routerLink="/" aria-label="Accueil C'EMPIRE">
          <img class="brand-logo" src="/media/logos/cempire-log.jpg" alt="Logo C'EMPIRE" loading="eager" />
          <span class="brand-name">C'EMPIRE</span>
        </a>

        <!-- Navigation principale (desktop) -->
        <nav class="top-nav" aria-label="Navigation principale">
          @for (link of navLinks; track link.route) {
            <a class="nav-link" [routerLink]="link.route">
              <span class="nav-icon material-icons">{{ link.icon }}</span>
              {{ link.label }}
            </a>
          }
        </nav>

        <!-- Actions droite -->
        <div class="nav-actions">
          <!-- Panier -->
          <a class="chip chip-cart" [routerLink]="['/shop/cart']" aria-label="Aller au panier">
            <span class="material-icons">shopping_bag</span>
            <span class="chip-label">Panier</span>
          </a>

          <!-- Notifications (si connecté) -->
          @if (currentUser()) {
            <button
              class="icon-btn"
              [matMenuTriggerFor]="notifMenu"
              (menuOpened)="loadNotifications()"
              aria-label="Notifications"
            >
              <span
                class="material-icons"
                [matBadge]="unreadCount"
                [matBadgeHidden]="unreadCount === 0"
                matBadgeColor="warn"
                matBadgeSize="small"
              >notifications</span>
            </button>

            <mat-menu #notifMenu="matMenu" xPosition="before">
              <div class="notif-panel" (click)="$event.stopPropagation()">
                <div class="notif-panel-head">
                  <span>Notifications</span>
                  @if (unreadCount > 0) {
                    <button class="notif-mark-read-btn" (click)="markAllRead()">Tout lire</button>
                  }
                </div>
                @if (notifications.length === 0) {
                  <div class="notif-empty">Aucune notification</div>
                }
                @for (n of notifications; track n.id) {
                  <div class="notif-card" [class.notif-card--unread]="!n.isRead">
                    <div class="notif-card-title">{{ n.title }}</div>
                    <div class="notif-card-msg">{{ n.message }}</div>
                    <div class="notif-card-time">{{ n.createdAt | date:'dd/MM/yyyy HH:mm' }}</div>
                  </div>
                }
              </div>
            </mat-menu>
          }

          <!-- Profil / Connexion -->
          @if (currentUser(); as user) {
            @if (isAdmin(user)) {
              <a class="chip chip-admin" [routerLink]="getAdminRoute(user)" aria-label="Espace administration">
                <span class="material-icons">admin_panel_settings</span>
              </a>
            }
            <button class="chip chip-profile" [matMenuTriggerFor]="profileMenu" aria-label="Menu profil">
              <span class="material-icons">account_circle</span>
              <span class="chip-label">{{ getUserLabel(user) }}</span>
              <span class="material-icons caret">expand_more</span>
            </button>
            <mat-menu #profileMenu="matMenu">
              <button mat-menu-item routerLink="/profile">
                <mat-icon>person</mat-icon><span>Mon profil</span>
              </button>
              @if (isAdmin(user)) {
                <button mat-menu-item [routerLink]="getAdminRoute(user)">
                  <mat-icon>admin_panel_settings</mat-icon><span>Administration</span>
                </button>
              }
              <button mat-menu-item (click)="logout()">
                <mat-icon>logout</mat-icon><span>Déconnexion</span>
              </button>
            </mat-menu>
          } @else {
            <a class="chip chip-login" [routerLink]="['/auth/signin']">
              <span class="material-icons">account_circle</span>
              <span class="chip-label">Connexion</span>
            </a>
          }

          <!-- Hamburger mobile -->
          <button class="icon-btn mobile-only" (click)="sidenav.toggle()" aria-label="Ouvrir le menu">
            <span class="material-icons">menu</span>
          </button>
        </div>
      </div>
    </mat-toolbar>

    <!-- ── CONTENEUR PRINCIPAL ── -->
    <mat-sidenav-container class="shell-container">

      <!-- Sidenav mobile -->
      <mat-sidenav #sidenav mode="over" class="sidenav" position="start">
        <div class="sidenav-brand">
          <span class="sidenav-title">C'EMPIRE</span>
          <button class="icon-btn" (click)="sidenav.close()" aria-label="Fermer le menu">
            <span class="material-icons">close</span>
          </button>
        </div>

        <mat-nav-list class="sidenav-list">
          @for (link of navLinks; track link.route) {
            <a mat-list-item [routerLink]="link.route" (click)="sidenav.close()">
              <mat-icon matListItemIcon>{{ link.icon }}</mat-icon>
              <span matListItemTitle>{{ link.label }}</span>
            </a>
          }
          @if (currentUser(); as user) {
            @if (isAdmin(user)) {
              <a mat-list-item [routerLink]="getAdminRoute(user)" (click)="sidenav.close()">
                <mat-icon matListItemIcon>admin_panel_settings</mat-icon>
                <span matListItemTitle>Administration</span>
              </a>
            }
          }
        </mat-nav-list>
      </mat-sidenav>

      <!-- Contenu -->
      <mat-sidenav-content>
        <main class="page-content page-enter">
          <router-outlet></router-outlet>
        </main>
        <app-site-footer></app-site-footer>
      </mat-sidenav-content>

    </mat-sidenav-container>
  `,
  styles: [`
    /* ══ NAVBAR ══ */
    .navbar {
      position: sticky;
      top: 12px;
      z-index: 100;
      margin: 12px 14px;
      padding: 0;
      height: 66px;
      border-radius: 20px;
      background: rgba(14, 11, 7, 0.90);
      backdrop-filter: blur(18px) saturate(1.4);
      -webkit-backdrop-filter: blur(18px) saturate(1.4);
      border: 1px solid rgba(255, 255, 255, 0.10);
      box-shadow:
        0 8px 32px rgba(0, 0, 0, 0.28),
        0 1px 0 rgba(255, 255, 255, 0.08) inset;
      color: #fff;
    }

    .nav-inner {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 0 16px;
    }

    /* ── Brand ── */
    .brand {
      display: inline-flex;
      align-items: center;
      gap: 9px;
      padding: 6px 14px 6px 8px;
      border-radius: 999px;
      text-decoration: none;
      flex-shrink: 0;
      background: rgba(201, 162, 39, 0.12);
      border: 1px solid rgba(201, 162, 39, 0.25);
      transition: background 0.2s ease, border-color 0.2s ease;

      &:hover {
        background: rgba(201, 162, 39, 0.20);
        border-color: rgba(201, 162, 39, 0.45);
      }
    }

    .brand-logo {
      width: auto;
      height: 26px;
      object-fit: contain;
      border-radius: 7px;
    }

    .brand-name {
      font-family: 'Sora', sans-serif;
      font-weight: 700;
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.92);
      white-space: nowrap;
      letter-spacing: 0.04em;
    }

    /* ── Navigation principale ── */
    .top-nav {
      display: flex;
      align-items: center;
      gap: 2px;
      flex: 1;
      overflow-x: auto;
      scrollbar-width: none;
      padding-left: 10px;
      border-left: 1px solid rgba(255, 255, 255, 0.10);
      margin-left: 6px;
      &::-webkit-scrollbar { display: none; }
    }

    .nav-link {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      text-decoration: none;
      white-space: nowrap;
      color: rgba(255, 255, 255, 0.65);
      font-weight: 600;
      font-size: 0.875rem;
      padding: 7px 12px;
      border-radius: 12px;
      transition: all 0.18s ease;

      .nav-icon {
        font-size: 17px;
        opacity: 0.8;
      }

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.09);
      }
    }

    /* ── Actions ── */
    .nav-actions {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      margin-left: 8px;
      flex-shrink: 0;
    }

    /* Bouton icône générique */
    .icon-btn {
      width: 40px;
      height: 40px;
      border: none;
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.80);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all 0.18s ease;
      padding: 0;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        color: #fff;
      }

      .material-icons { font-size: 20px; }
    }

    /* Chips */
    .chip {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      height: 40px;
      border-radius: 12px;
      font-weight: 600;
      font-size: 0.87rem;
      border: none;
      cursor: pointer;
      padding: 0 14px;
      text-decoration: none;
      transition: all 0.18s ease;
      white-space: nowrap;
      background: none;

      .material-icons { font-size: 18px; }
    }

    .chip-cart {
      background: linear-gradient(135deg, #E8683A, #C94E22);
      color: #fff;
      box-shadow: 0 4px 16px rgba(232, 104, 58, 0.35);
      &:hover { box-shadow: 0 6px 20px rgba(232, 104, 58, 0.50); transform: translateY(-1px); }
    }

    .chip-admin {
      background: rgba(201, 162, 39, 0.15);
      color: #ECC84A;
      border: 1px solid rgba(201, 162, 39, 0.30);
      &:hover { background: rgba(201, 162, 39, 0.25); }
    }

    .chip-profile {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.12);
      &:hover { background: rgba(255, 255, 255, 0.14); color: #fff; }

      .caret { font-size: 16px; opacity: 0.6; }
    }

    .chip-login {
      background: rgba(255, 255, 255, 0.08);
      color: rgba(255, 255, 255, 0.82);
      border: 1px solid rgba(255, 255, 255, 0.12);
      &:hover { background: rgba(255, 255, 255, 0.14); color: #fff; }
    }

    .chip-label {
      max-width: 140px;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .mobile-only { display: none; }

    /* ══ SIDENAV ══ */
    .shell-container {
      min-height: calc(100vh - 92px);
      background: transparent;
    }

    .sidenav {
      width: 290px;
      background: #111009;
      border-right: 1px solid rgba(255,255,255,0.08);
      box-shadow: 4px 0 24px rgba(0,0,0,0.35);
    }

    .sidenav-brand {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 20px 16px 14px;
      border-bottom: 1px solid rgba(255,255,255,0.08);
    }

    .sidenav-title {
      font-family: 'Sora', sans-serif;
      font-weight: 700;
      font-size: 1.1rem;
      color: rgba(255,255,255,0.90);
      letter-spacing: 0.06em;
    }

    .sidenav-list {
      padding: 10px 8px;

      .mat-mdc-list-item {
        border-radius: 12px !important;
        margin-bottom: 2px;
        color: rgba(255,255,255,0.65) !important;

        &:hover {
          background: rgba(232, 104, 58, 0.12) !important;
          color: rgba(255,255,255,0.92) !important;
        }
      }

      mat-icon { color: rgba(232, 104, 58, 0.80) !important; }
    }

    /* ══ CONTENU ══ */
    .page-content {
      padding: 18px 16px 36px;
      min-height: calc(100vh - 120px);
    }

    /* ══ RESPONSIVE ══ */
    @media (max-width: 960px) {
      .top-nav { display: none; }
      .brand-name { display: none; }
      .chip-label { display: none; }
      .mobile-only { display: inline-flex; }
      .chip { padding: 0; width: 40px; justify-content: center; }
      .chip-cart { padding: 0 10px; width: auto; }
      .chip-cart .chip-label { display: none; }
      .chip-cart { width: 40px; padding: 0; }
      .chip-admin { width: 40px; padding: 0; }
    }

    @media (max-width: 480px) {
      .navbar { margin: 8px; top: 8px; height: 58px; border-radius: 16px; }
      .nav-inner { padding: 0 10px; }
      .nav-actions { gap: 4px; }
      .page-content { padding: 10px 10px 28px; }
    }
  `],
})
export class LayoutComponent implements OnInit, OnDestroy {
  private readonly authService = inject(AuthService);
  private readonly router       = inject(Router);
  private readonly apiService   = inject(ApiService);

  readonly currentUser = toSignal(this.authService.currentUser$, { initialValue: null });

  notifications: AppNotification[] = [];
  private pollSub: Subscription | null = null;

  get unreadCount(): number {
    return this.notifications.filter(n => !n.isRead).length;
  }

  readonly navLinks = [
    { route: '/',        label: 'Accueil',  icon: 'home' },
    { route: '/shop',    label: 'Boutique', icon: 'storefront' },
    { route: '/grill',   label: 'Grill',    icon: 'restaurant' },
    { route: '/express', label: 'Express',  icon: 'local_shipping' },
    { route: '/clean',   label: 'Clean',    icon: 'cleaning_services' },
    { route: '/events',  label: 'Events',   icon: 'event' },
    { route: '/todo',    label: 'Todo',     icon: 'checklist' },
  ];

  ngOnInit(): void {
    this.pollSub = interval(60_000)
      .pipe(
        switchMap(() => this.authService.currentUser$),
        filter(user => !!user),
        switchMap(() => this.apiService.get<AppNotification[]>('/notifications/me')),
      )
      .subscribe({
        next: data => {
          this.notifications = Array.isArray(data)
            ? data.filter(n => n.channel === 'IN_APP')
            : [];
        },
        error: () => {},
      });
  }

  ngOnDestroy(): void {
    this.pollSub?.unsubscribe();
  }

  loadNotifications(): void {
    this.apiService.get<AppNotification[]>('/notifications/me').subscribe({
      next: data => {
        this.notifications = Array.isArray(data)
          ? data.filter(n => n.channel === 'IN_APP')
          : [];
      },
      error: () => {},
    });
  }

  markAllRead(): void {
    this.apiService.patch('/notifications/mark-all-read', {}).subscribe({
      next: () => {
        this.notifications = this.notifications.map(n => ({ ...n, isRead: true }));
      },
      error: () => {},
    });
  }

  isAdmin(user: { role?: string } | null): boolean {
    if (!user) return false;
    return user.role === UserRole.ADMIN || user.role === UserRole.SUPER_ADMIN;
  }

  getUserLabel(user: { email?: string } | null): string {
    if (!user?.email) return 'Profil';
    const local = user.email.split('@')[0]?.trim();
    return local?.length ? local : 'Profil';
  }

  getAdminRoute(user: { role?: string } | null): string {
    return user?.role === UserRole.SUPER_ADMIN
      ? '/super-admin/dashboard'
      : '/admin/dashboard';
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
