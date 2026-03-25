import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AdminService } from '../../services/admin.service';
import { AdminStats } from '../../models/admin.models';
import { StatCardComponent } from '../../../../shared/ui/stat-card/stat-card.component';
import { PageHeaderComponent } from '../../../../shared/ui/page-header/page-header.component';

@Component({
  selector: 'app-admin-dashboard',
  imports: [
    RouterLink,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    StatCardComponent,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="dashboard">
      <app-page-header
        title="Tableau de bord"
        subtitle="Vue d'ensemble de la plateforme"
        [breadcrumbs]="[]"
      >
        <button mat-stroked-button slot="actions" (click)="loadStats()">
          <mat-icon>refresh</mat-icon>
          Actualiser
        </button>
      </app-page-header>

      @if (loading()) {
        <div class="loading-state">
          <mat-spinner diameter="48" />
          <p>Chargement des statistiques...</p>
        </div>
      } @else if (error()) {
        <div class="error-state" role="alert">
          <mat-icon class="error-icon">error_outline</mat-icon>
          <p>{{ error() }}</p>
          <button mat-flat-button class="retry-btn" (click)="loadStats()">
            <mat-icon>refresh</mat-icon>
            Réessayer
          </button>
        </div>
      } @else if (stats()) {
        <!-- KPI Row 1 : utilisateurs -->
        <section class="kpi-section" aria-label="Statistiques utilisateurs">
          <h2 class="section-title">Utilisateurs</h2>
          <div class="stats-grid">
            <app-stat-card
              title="Total utilisateurs"
              [value]="stats()!.totalUsers"
              icon="group"
              color="blue"
            />
            <app-stat-card
              title="Utilisateurs actifs"
              [value]="stats()!.activeUsers"
              icon="check_circle"
              color="green"
            />
            <app-stat-card
              title="Inactifs"
              [value]="stats()!.inactiveUsers"
              icon="cancel"
              color="red"
            />
            <app-stat-card
              title="Nouveaux ce mois"
              [value]="stats()!.newUsersThisMonth"
              icon="person_add"
              color="orange"
            />
          </div>
        </section>

        <!-- KPI Row 2 : rôles -->
        <section class="kpi-section" aria-label="Répartition des rôles">
          <h2 class="section-title">Rôles</h2>
          <div class="stats-grid stats-grid--4">
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
              title="Admins"
              [value]="stats()!.adminCount"
              icon="admin_panel_settings"
              color="purple"
            />
            <app-stat-card
              title="Super Admins"
              [value]="stats()!.superAdminCount"
              icon="security"
              color="red"
            />
          </div>
        </section>

        <!-- Quick actions -->
        <section class="quick-actions" aria-label="Actions rapides">
          <h2 class="section-title">Actions rapides</h2>
          <div class="actions-grid">
            @for (action of quickActions; track action.label) {
              <a [routerLink]="action.route" class="action-card">
                <mat-icon [style.color]="action.color" aria-hidden="true">{{ action.icon }}</mat-icon>
                <span>{{ action.label }}</span>
              </a>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: [`
    .dashboard {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }
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
    .error-icon {
      font-size: 3rem;
      width: 3rem;
      height: 3rem;
      color: #c62828;
    }
    .error-state p { color: #c62828; margin: 0; }
    .retry-btn { background-color: #c62828; color: white; }

    .kpi-section { margin-bottom: 2.5rem; }
    .section-title {
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      color: #999;
      margin: 0 0 1rem;
    }
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
      gap: 1rem;
    }

    .quick-actions { margin-top: 1rem; }
    .actions-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(170px, 1fr));
      gap: 1rem;
    }
    .action-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.6rem;
      padding: 1.5rem 1rem;
      background: white;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0,0,0,0.06);
      text-decoration: none;
      color: #1a1a2e;
      font-size: 0.85rem;
      font-weight: 500;
      text-align: center;
      transition: box-shadow 0.2s, transform 0.2s;
    }
    .action-card:hover {
      box-shadow: 0 6px 20px rgba(0,0,0,0.12);
      transform: translateY(-2px);
    }
    .action-card mat-icon { font-size: 2rem; width: 2rem; height: 2rem; }
  `]
})
export class AdminDashboardComponent implements OnInit {
  private readonly adminService = inject(AdminService);

  readonly stats = signal<AdminStats | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);

  readonly quickActions = [
    { label: 'Utilisateurs', route: '/admin/users', icon: 'group', color: '#1565c0' },
    { label: 'Commandes', route: '/admin/shop/products', icon: 'shopping_bag', color: '#c62828' },
    { label: 'Livraisons', route: '/admin/express/deliveries', icon: 'local_shipping', color: '#e65100' },
    { label: 'Réservations events', route: '/admin/events/bookings', icon: 'event', color: '#6a1b9a' },
    { label: 'Promotions', route: '/admin/shop/promotions', icon: 'sell', color: '#2e7d32' },
    { label: 'Pages contenu', route: '/admin/marketing/pages', icon: 'article', color: '#1565c0' },
  ];

  ngOnInit(): void {
    this.loadStats();
  }

  loadStats(): void {
    this.loading.set(true);
    this.error.set(null);

    this.adminService.getStats().subscribe({
      next: (stats) => {
        this.stats.set(stats);
        this.loading.set(false);
      },
      error: (err: { status?: number }) => {
        this.loading.set(false);
        if (err.status === 403) {
          this.error.set('Accès refusé. Vous devez être connecté en tant qu\'administrateur.');
        } else if (err.status === 401) {
          this.error.set('Session expirée. Veuillez vous reconnecter.');
        } else {
          this.error.set('Erreur lors du chargement des statistiques. Veuillez réessayer.');
        }
      },
    });
  }
}
