import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  superAdminOnly?: boolean;
}

@Component({
  selector: 'app-admin-layout',
  imports: [RouterLink, RouterLinkActive, RouterOutlet],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss',
})
export class AdminLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  readonly sidebarCollapsed = signal(false);
  readonly currentUser = this.authService.getCurrentUser();
  readonly isSuperAdmin = this.currentUser?.role === 'super_admin';

  readonly userInitial = (this.currentUser?.email ?? 'U')[0].toUpperCase();

  readonly navItems: NavItem[] = [
    { icon: '📊', label: 'Tableau de bord',        route: '/super-admin/dashboard' },
    { icon: '👥', label: 'Utilisateurs',            route: '/super-admin/users' },
    { icon: '🏢', label: 'Secteurs',                route: '/super-admin/sectors',             superAdminOnly: true },
    { icon: '🛍️', label: "Produits C'Shop",         route: '/super-admin/shop/products' },
    { icon: '🏷️', label: "Promos C'Shop",           route: '/super-admin/shop/promotions' },
    { icon: '🍖', label: "Produits C'Grill",        route: '/super-admin/grill/products' },
    { icon: '🍱', label: "Menus C'Grill",           route: '/super-admin/grill/menus' },
    { icon: '🧹', label: "Services C'Clean",        route: '/super-admin/clean/services' },
    { icon: '🔧', label: "Services C'Todo",         route: '/super-admin/todo/services' },
    { icon: '📋', label: 'Tâches employés',          route: '/super-admin/tasks' },
    { icon: '🎉', label: "C'Events Catalogue",      route: '/super-admin/events/catalog' },
    { icon: '🗓️', label: "C'Events Réservations",  route: '/super-admin/events/bookings' },
    { icon: '🚚', label: "C'Express Livraisons",    route: '/super-admin/express/deliveries' },
    { icon: '🛵', label: "C'Express Couriers",      route: '/super-admin/express/couriers' },
    { icon: '🌍', label: "C'Express Import/Export", route: '/super-admin/express/import-export' },
    { icon: '👷', label: 'Employés',                route: '/super-admin/employees' },
    { icon: '🛒', label: 'Clients',                 route: '/super-admin/clients' },
    { icon: '📦', label: 'Commandes globales',      route: '/super-admin/orders' },
    { icon: '🎯', label: 'Campagnes fêtes',         route: '/super-admin/marketing/campaigns' },
    { icon: '📰', label: 'Actualités',              route: '/super-admin/marketing/news' },
    { icon: '🦶', label: 'Footer site',             route: '/super-admin/marketing/footer' },
    { icon: '📄', label: 'Pages site',              route: '/super-admin/marketing/pages' },
  ];

  get visibleNavItems(): NavItem[] {
    return this.navItems.filter((item) => !item.superAdminOnly || this.isSuperAdmin);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
