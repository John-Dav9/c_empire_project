import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { buildApiUrl } from '../../../core/config/api.config';

interface AdminStats {
  totalUsers: number;
  activeUsers?: number;
  inactiveUsers?: number;
  adminCount?: number;
  superAdminCount?: number;
  employeeCount?: number;
  clientCount?: number;
  newUsersThisMonth?: number;
}

interface CrudModuleCard {
  key: string;
  label: string;
  icon: string;
  description: string;
  route: string;
  count: number;
  accentClass: string;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrl: './super-admin-dashboard.component.scss',
})
export class SuperAdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  loading = true;
  error: string | null = null;
  stats: AdminStats | null = null;
  modules: CrudModuleCard[] = [];

  readonly kpi = {
    services: 6,
    crudModules: 8,
  };

  ngOnInit(): void {
    this.loadDashboard();
  }

  retry(): void {
    this.loadDashboard();
  }

  go(route: string): void {
    this.router.navigate([route]);
  }

  private loadDashboard(): void {
    this.loading = true;
    this.error = null;

    forkJoin({
      stats: this.http.get<AdminStats>(buildApiUrl('/admin/stats')),
      sectors: this.http.get<unknown>(buildApiUrl('/sectors')).pipe(catchError(() => of([]))),
      shopProducts: this.http
        .get<unknown>(buildApiUrl('/cshop/products?limit=1&page=1'))
        .pipe(catchError(() => of([]))),
      grillProducts: this.http
        .get<unknown>(buildApiUrl('/grill/products/admin/all'))
        .pipe(catchError(() => of([]))),
      grillMenus: this.http
        .get<unknown>(buildApiUrl('/grill/menu-packs/admin/all'))
        .pipe(catchError(() => of([]))),
      cleanServices: this.http
        .get<unknown>(buildApiUrl('/cclean/services?includeInactive=true'))
        .pipe(catchError(() => of([]))),
      todoServices: this.http
        .get<unknown>(buildApiUrl('/admin/c-todo/services'))
        .pipe(catchError(() => of([]))),
      users: this.http
        .get<unknown>(buildApiUrl('/admin/users?limit=1&page=1'))
        .pipe(catchError(() => of([]))),
      orders: this.http
        .get<unknown>(buildApiUrl('/grill/orders/admin/all'))
        .pipe(catchError(() => of([]))),
    }).subscribe({
      next: (data) => {
        this.stats = data.stats;

        this.modules = [
          {
            key: 'users',
            label: 'Utilisateurs',
            icon: '👥',
            description: 'Créer, éditer, activer, supprimer des comptes.',
            route: '/super-admin/users',
            count: this.extractCount(data.users),
            accentClass: 'accent-users',
          },
          {
            key: 'sectors',
            label: 'Secteurs',
            icon: '🏢',
            description: "Piloter la structure globale de la plateforme.",
            route: '/super-admin/sectors',
            count: this.extractCount(data.sectors),
            accentClass: 'accent-sectors',
          },
          {
            key: 'shop',
            label: "C'Shop Produits",
            icon: '🛍️',
            description: 'Gérer le catalogue produit et la disponibilité.',
            route: '/super-admin/shop/products',
            count: this.extractCount(data.shopProducts),
            accentClass: 'accent-shop',
          },
          {
            key: 'grill-products',
            label: "C'Grill Produits",
            icon: '🍖',
            description: 'Administrer les articles food et grillades.',
            route: '/super-admin/grill/products',
            count: this.extractCount(data.grillProducts),
            accentClass: 'accent-grill',
          },
          {
            key: 'grill-menus',
            label: "C'Grill Menus",
            icon: '🍱',
            description: 'Composer et maintenir les packs/menu.',
            route: '/super-admin/grill/menus',
            count: this.extractCount(data.grillMenus),
            accentClass: 'accent-grill',
          },
          {
            key: 'clean',
            label: "C'Clean Services",
            icon: '🧹',
            description: 'Modifier services, prix et état actif.',
            route: '/super-admin/clean/services',
            count: this.extractCount(data.cleanServices),
            accentClass: 'accent-clean',
          },
          {
            key: 'todo',
            label: "C'Todo Services",
            icon: '🔧',
            description: 'Ajouter, éditer et supprimer les offres Todo.',
            route: '/super-admin/todo/services',
            count: this.extractCount(data.todoServices),
            accentClass: 'accent-todo',
          },
          {
            key: 'orders',
            label: 'Commandes Globales',
            icon: '📦',
            description: 'Suivre et mettre a jour les commandes CShop, CGrill, CClean, CTodo et CEvents.',
            route: '/super-admin/orders',
            count: this.extractCount(data.orders),
            accentClass: 'accent-orders',
          },
        ];
      },
      error: () => {
        this.error =
          'Impossible de charger le cockpit super-admin. Vérifiez les accès API.';
      },
      complete: () => {
        this.loading = false;
      },
    });
  }

  private extractCount(payload: unknown): number {
    if (Array.isArray(payload)) {
      return payload.length;
    }

    if (!payload || typeof payload !== 'object') {
      return 0;
    }

    const record = payload as Record<string, unknown>;
    if (typeof record['total'] === 'number') {
      return record['total'];
    }

    if (Array.isArray(record['data'])) {
      return record['data'].length;
    }

    return 0;
  }
}
