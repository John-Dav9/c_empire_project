import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { DatePipe } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { buildApiUrl } from '../../../core/config/api.config';
import { StatCardComponent } from '../../../shared/ui/stat-card/stat-card.component';
import { PageHeaderComponent } from '../../../shared/ui/page-header/page-header.component';
import { StatusBadgeComponent } from '../../../shared/ui/status-badge/status-badge.component';
import { CurrencyXafPipe } from '../../../shared/pipes/currency-xaf.pipe';

interface PlatformStats {
  totalUsers: number;
  activeUsers: number;
  newUsersThisMonth: number;
  clientCount: number;
  employeeCount: number;
  adminCount: number;
  superAdminCount: number;
}

interface ModuleCard {
  label: string;
  icon: string;
  matIcon: string;
  route: string;
  count: number;
  color: string;
  description: string;
}

interface RecentOrder {
  id: string;
  type: string;
  amount: number;
  status: string;
  date: string;
  customerName: string;
}

@Component({
  selector: 'app-super-admin-dashboard',
  imports: [
    RouterLink,
    DatePipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    StatCardComponent,
    PageHeaderComponent,
    StatusBadgeComponent,
    CurrencyXafPipe,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <app-page-header
        title="Control Tower"
        subtitle="Pilotage global de la plateforme C'EMPIRE"
      >
        <button mat-stroked-button slot="actions" (click)="loadDashboard()">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
        <a mat-flat-button slot="actions" routerLink="/super-admin/orders" class="orders-btn">
          <mat-icon>inventory_2</mat-icon>
          Commandes
        </a>
      </app-page-header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="48" />
          <p>Chargement du cockpit...</p>
        </div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-flat-button class="retry-btn" (click)="loadDashboard()">
            <mat-icon>refresh</mat-icon>
            Réessayer
          </button>
        </div>
      } @else {

        <!-- KPI utilisateurs -->
        <section class="kpi-section" aria-label="KPIs utilisateurs">
          <h2 class="section-title">Utilisateurs</h2>
          <div class="stats-grid">
            <app-stat-card
              title="Total utilisateurs"
              [value]="stats()!.totalUsers"
              icon="group"
              color="blue"
            />
            <app-stat-card
              title="Actifs"
              [value]="stats()!.activeUsers"
              icon="verified_user"
              color="green"
            />
            <app-stat-card
              title="Clients"
              [value]="stats()!.clientCount"
              icon="shopping_cart"
              color="blue"
            />
            <app-stat-card
              title="Employés"
              [value]="stats()!.employeeCount"
              icon="engineering"
              color="orange"
            />
            <app-stat-card
              title="Nouveaux ce mois"
              [value]="stats()!.newUsersThisMonth"
              icon="person_add"
              color="purple"
            />
          </div>
        </section>

        <mat-divider />

        <!-- Modules métier -->
        <section class="modules-section" aria-label="Modules de gestion">
          <h2 class="section-title">Modules de gestion</h2>
          <div class="modules-grid">
            @for (m of modules(); track m.route) {
              <a [routerLink]="m.route" class="module-card" [style.--accent]="m.color">
                <div class="module-icon-wrap">
                  <mat-icon [style.color]="m.color" aria-hidden="true">{{ m.matIcon }}</mat-icon>
                </div>
                <div class="module-body">
                  <p class="module-label">{{ m.label }}</p>
                  <p class="module-desc">{{ m.description }}</p>
                </div>
                <span class="module-count">{{ m.count }}</span>
              </a>
            }
          </div>
        </section>

        <mat-divider />

        <!-- Activité récente + Alertes -->
        <div class="bottom-grid">
          <!-- Activité récente -->
          <section class="recent-section" aria-label="Activité récente">
            <h2 class="section-title">Activité récente</h2>
            @if (recentOrders().length === 0) {
              <p class="empty-msg">Aucune commande récente.</p>
            } @else {
              <div class="recent-list">
                @for (order of recentOrders(); track order.id) {
                  <div class="recent-item">
                    <div class="recent-type-icon" [style.background]="typeColor(order.type)">
                      <mat-icon aria-hidden="true">{{ typeIcon(order.type) }}</mat-icon>
                    </div>
                    <div class="recent-info">
                      <p class="recent-customer">{{ order.customerName }}</p>
                      <p class="recent-meta">{{ typeLabel(order.type) }} · {{ order.date | date:'dd/MM HH:mm' }}</p>
                    </div>
                    <div class="recent-right">
                      <p class="recent-amount">{{ order.amount | currencyXaf }}</p>
                      <app-status-badge [status]="order.status" size="sm" />
                    </div>
                  </div>
                }
              </div>
              <a mat-button routerLink="/super-admin/orders" class="see-all-btn">
                Voir toutes les commandes
                <mat-icon>arrow_forward</mat-icon>
              </a>
            }
          </section>

          <!-- Raccourcis rapides -->
          <section class="shortcuts-section" aria-label="Raccourcis">
            <h2 class="section-title">Accès rapides</h2>
            <div class="shortcuts-list">
              @for (s of shortcuts; track s.label) {
                <a [routerLink]="s.route" class="shortcut-item">
                  <mat-icon [style.color]="s.color">{{ s.icon }}</mat-icon>
                  <span>{{ s.label }}</span>
                  <mat-icon class="chevron">chevron_right</mat-icon>
                </a>
              }
            </div>
          </section>
        </div>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1600px;
      margin: 0 auto;
    }
    .orders-btn { background-color: #c62828; color: white; }

    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 4rem;
      color: #888;
    }
    .error-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 1rem;
      padding: 3rem;
      background: #fff5f5;
      border-radius: 12px;
      text-align: center;
    }
    .error-icon { font-size: 3rem; width: 3rem; height: 3rem; color: #c62828; }
    .error-state p { color: #c62828; margin: 0; }
    .retry-btn { background-color: #c62828; color: white; }

    .section-title {
      font-size: 0.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.07em;
      color: #aaa;
      margin: 0 0 1rem;
    }
    .kpi-section { margin-bottom: 2rem; }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 1rem;
    }

    mat-divider { margin: 2rem 0; }

    /* Modules */
    .modules-section { margin-bottom: 2rem; }
    .modules-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
      gap: 1rem;
    }
    .module-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem 1.25rem;
      background: white;
      border-radius: 12px;
      border: 1px solid #f0f0f0;
      border-left: 3px solid var(--accent, #ccc);
      text-decoration: none;
      color: inherit;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .module-card:hover {
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
      transform: translateY(-1px);
    }
    .module-icon-wrap {
      width: 40px;
      height: 40px;
      border-radius: 10px;
      background: #f8f8f8;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .module-body { flex: 1; min-width: 0; }
    .module-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1a1a2e;
      margin: 0 0 0.15rem;
    }
    .module-desc {
      font-size: 0.73rem;
      color: #999;
      margin: 0;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .module-count {
      font-size: 1.1rem;
      font-weight: 800;
      color: #1a1a2e;
      flex-shrink: 0;
    }

    /* Bottom grid */
    .bottom-grid {
      display: grid;
      grid-template-columns: 1fr 320px;
      gap: 2rem;
      align-items: start;
    }

    /* Recent activity */
    .recent-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .recent-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 1rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
    }
    .recent-type-icon {
      width: 38px;
      height: 38px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      opacity: 0.85;
    }
    .recent-type-icon mat-icon { color: white; font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }
    .recent-info { flex: 1; min-width: 0; }
    .recent-customer { font-size: 0.875rem; font-weight: 600; color: #1a1a2e; margin: 0 0 0.1rem; }
    .recent-meta { font-size: 0.72rem; color: #aaa; margin: 0; }
    .recent-right { display: flex; flex-direction: column; align-items: flex-end; gap: 0.3rem; flex-shrink: 0; }
    .recent-amount { font-size: 0.875rem; font-weight: 700; color: #1a1a2e; margin: 0; }
    .see-all-btn { margin-top: 0.5rem; color: #c62828; display: flex; align-items: center; gap: 0.25rem; }
    .empty-msg { color: #aaa; font-size: 0.875rem; }

    /* Shortcuts */
    .shortcuts-list { display: flex; flex-direction: column; gap: 0.5rem; }
    .shortcut-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.875rem 1rem;
      background: white;
      border-radius: 10px;
      box-shadow: 0 1px 6px rgba(0,0,0,0.05);
      text-decoration: none;
      color: #1a1a2e;
      font-size: 0.875rem;
      font-weight: 500;
      transition: box-shadow 0.15s;
    }
    .shortcut-item:hover { box-shadow: 0 3px 12px rgba(0,0,0,0.1); }
    .chevron { margin-left: auto; color: #ccc; font-size: 1.1rem; width: 1.1rem; height: 1.1rem; }

    @media (max-width: 900px) {
      .bottom-grid { grid-template-columns: 1fr; }
    }
  `]
})
export class SuperAdminDashboardComponent implements OnInit {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);

  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly stats = signal<PlatformStats | null>(null);
  readonly modules = signal<ModuleCard[]>([]);
  readonly recentOrders = signal<RecentOrder[]>([]);

  readonly shortcuts = [
    { label: 'Gestion utilisateurs',    route: '/super-admin/users',              icon: 'manage_accounts',      color: '#1565c0' },
    { label: 'Suivi commandes global',  route: '/super-admin/orders',             icon: 'inventory_2',          color: '#c62828' },
    { label: 'Gestion clients CRM',     route: '/super-admin/clients',            icon: 'people_alt',           color: '#2e7d32' },
    { label: 'Livraisons C\'Express',   route: '/super-admin/express/deliveries', icon: 'local_shipping',       color: '#e65100' },
    { label: 'Réservations events',     route: '/super-admin/events/bookings',    icon: 'event',                color: '#6a1b9a' },
    { label: 'Campagnes marketing',     route: '/super-admin/marketing/campaigns',icon: 'campaign',             color: '#1565c0' },
    { label: 'Employés',                route: '/super-admin/employees',          icon: 'badge',                color: '#e65100' },
  ];

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      stats: this.http.get<PlatformStats>(buildApiUrl('/admin/stats')).pipe(catchError(() => of(null))),
      sectors: this.http.get<unknown[]>(buildApiUrl('/sectors')).pipe(catchError(() => of([]))),
      shopProducts: this.http.get<unknown>(buildApiUrl('/cshop/products?limit=1&page=1')).pipe(catchError(() => of([]))),
      grillProducts: this.http.get<unknown[]>(buildApiUrl('/grill/products/admin/all')).pipe(catchError(() => of([]))),
      grillMenus: this.http.get<unknown[]>(buildApiUrl('/grill/menu-packs/admin/all')).pipe(catchError(() => of([]))),
      cleanServices: this.http.get<unknown[]>(buildApiUrl('/cclean/services?includeInactive=true')).pipe(catchError(() => of([]))),
      todoServices: this.http.get<unknown[]>(buildApiUrl('/admin/c-todo/services')).pipe(catchError(() => of([]))),
      users: this.http.get<unknown>(buildApiUrl('/admin/users?limit=1&page=1')).pipe(catchError(() => of([]))),
      recentOrders: this.http.get<unknown[]>(buildApiUrl('/grill/orders/admin/all')).pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        if (data.stats) this.stats.set(data.stats);

        this.modules.set([
          { label: 'Utilisateurs',        matIcon: 'group',             icon: '👥', route: '/super-admin/users',              count: this.extractCount(data.users),         color: '#1565c0', description: 'Créer, éditer, désactiver les comptes' },
          { label: 'Secteurs',            matIcon: 'domain',            icon: '🏢', route: '/super-admin/sectors',             count: this.extractCount(data.sectors),       color: '#616161', description: 'Structure globale de la plateforme' },
          { label: "C'Shop Produits",     matIcon: 'shopping_bag',      icon: '🛍️', route: '/super-admin/shop/products',        count: this.extractCount(data.shopProducts),  color: '#1565c0', description: 'Catalogue produit et disponibilité' },
          { label: "C'Grill Produits",    matIcon: 'restaurant',        icon: '🍖', route: '/super-admin/grill/products',       count: this.extractCount(data.grillProducts), color: '#e65100', description: 'Articles food et grillades' },
          { label: "C'Grill Menus",       matIcon: 'menu_book',         icon: '🍱', route: '/super-admin/grill/menus',          count: this.extractCount(data.grillMenus),    color: '#e65100', description: 'Packs et menus composés' },
          { label: "C'Clean Services",    matIcon: 'cleaning_services', icon: '🧹', route: '/super-admin/clean/services',       count: this.extractCount(data.cleanServices), color: '#2e7d32', description: 'Services, prix et état actif' },
          { label: "C'Todo Services",     matIcon: 'assignment',        icon: '🔧', route: '/super-admin/todo/services',        count: this.extractCount(data.todoServices),  color: '#c62828', description: 'Offres de missions disponibles' },
          { label: 'Commandes globales',  matIcon: 'inventory_2',       icon: '📦', route: '/super-admin/orders',              count: this.extractCount(data.recentOrders),  color: '#6a1b9a', description: 'Shop, Grill, Clean, Todo, Events' },
        ]);

        // Activité récente — utilise les grill orders comme proxy
        const rawOrders = Array.isArray(data.recentOrders) ? data.recentOrders.slice(0, 8) : [];
        this.recentOrders.set(rawOrders.map((o: any) => ({
          id: o.id,
          type: 'grill',
          amount: o.totalAmount ?? o.total ?? 0,
          status: (o.status ?? 'pending').toLowerCase(),
          date: o.createdAt ?? new Date().toISOString(),
          customerName: o.user?.firstname
            ? `${o.user.firstname} ${o.user.lastname ?? ''}`
            : 'Client',
        })));

        this.loading.set(false);
      },
      error: () => {
        this.error.set('Impossible de charger le cockpit. Vérifiez vos accès API.');
        this.loading.set(false);
      },
    });
  }

  typeIcon(type: string): string {
    const icons: Record<string, string> = {
      shop: 'shopping_bag', grill: 'restaurant', clean: 'cleaning_services',
      todo: 'assignment', event: 'event', express: 'local_shipping',
    };
    return icons[type] ?? 'inventory_2';
  }

  typeLabel(type: string): string {
    const labels: Record<string, string> = {
      shop: "C'Shop", grill: "C'Grill", clean: "C'Clean",
      todo: "C'Todo", event: "C'Events", express: "C'Express",
    };
    return labels[type] ?? type;
  }

  typeColor(type: string): string {
    const colors: Record<string, string> = {
      shop: '#1565c0', grill: '#e65100', clean: '#2e7d32',
      todo: '#c62828', event: '#6a1b9a', express: '#f57c00',
    };
    return colors[type] ?? '#757575';
  }

  private extractCount(payload: unknown): number {
    if (Array.isArray(payload)) return payload.length;
    if (!payload || typeof payload !== 'object') return 0;
    const r = payload as Record<string, unknown>;
    if (typeof r['total'] === 'number') return r['total'];
    if (Array.isArray(r['data'])) return r['data'].length;
    return 0;
  }
}
