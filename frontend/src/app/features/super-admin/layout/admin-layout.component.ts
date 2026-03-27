import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  superAdminOnly?: boolean;
}

interface NavGroup {
  label: string;
  items: NavItem[];
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
  readonly mobileMenuOpen = signal(false);
  readonly currentUser = this.authService.getCurrentUser();
  readonly isSuperAdmin = this.currentUser?.role === 'super_admin';

  readonly userInitial = (this.currentUser?.email ?? 'U')[0].toUpperCase();

  readonly navGroups: NavGroup[] = [
    {
      label: 'Général',
      items: [
        { icon: '📊', label: 'Tableau de bord', route: '/super-admin/dashboard' },
        { icon: '👥', label: 'Utilisateurs',    route: '/super-admin/users' },
        { icon: '🏢', label: 'Secteurs',        route: '/super-admin/sectors', superAdminOnly: true },
      ],
    },
    {
      label: "C'Shop",
      items: [
        { icon: '🛍️', label: 'Produits',    route: '/super-admin/shop/products' },
        { icon: '🏷️', label: 'Promotions',  route: '/super-admin/shop/promotions' },
        { icon: '📦', label: 'Commandes',   route: '/super-admin/shop/orders' },
      ],
    },
    {
      label: "C'Grill",
      items: [
        { icon: '🍖', label: 'Produits',  route: '/super-admin/grill/products' },
        { icon: '🍱', label: 'Menus',     route: '/super-admin/grill/menus' },
        { icon: '🧾', label: 'Commandes', route: '/super-admin/grill/orders' },
      ],
    },
    {
      label: "C'Clean",
      items: [
        { icon: '🧹', label: 'Services',      route: '/super-admin/clean/services' },
        { icon: '📋', label: 'Réservations',  route: '/super-admin/clean/bookings' },
      ],
    },
    {
      label: "C'Todo",
      items: [
        { icon: '🔧', label: 'Services',  route: '/super-admin/todo/services' },
        { icon: '✅', label: 'Commandes', route: '/super-admin/todo/orders' },
      ],
    },
    {
      label: "C'Events",
      items: [
        { icon: '🎉', label: 'Catalogue',      route: '/super-admin/events/catalog' },
        { icon: '🗓️', label: 'Réservations',  route: '/super-admin/events/bookings' },
      ],
    },
    {
      label: "C'Express",
      items: [
        { icon: '🚚', label: 'Livraisons',    route: '/super-admin/express/deliveries' },
        { icon: '🛵', label: 'Couriers',      route: '/super-admin/express/couriers' },
        { icon: '🌍', label: 'Import/Export', route: '/super-admin/express/import-export' },
      ],
    },
    {
      label: 'RH & Équipe',
      items: [
        { icon: '👷', label: 'Employés', route: '/super-admin/employees' },
        { icon: '📋', label: 'Tâches',   route: '/super-admin/tasks' },
        { icon: '📆', label: 'Agendas',  route: '/super-admin/schedule' },
      ],
    },
    {
      label: 'Clients & Commandes',
      items: [
        { icon: '🛒', label: 'Clients',            route: '/super-admin/clients' },
        { icon: '📦', label: 'Commandes globales', route: '/super-admin/orders' },
      ],
    },
    {
      label: 'Marketing',
      items: [
        { icon: '🎯', label: 'Campagnes fêtes', route: '/super-admin/marketing/campaigns' },
        { icon: '📰', label: 'Actualités',      route: '/super-admin/marketing/news' },
        { icon: '🦶', label: 'Footer site',     route: '/super-admin/marketing/footer' },
        { icon: '📄', label: 'Pages site',      route: '/super-admin/marketing/pages' },
      ],
    },
  ];

  get visibleNavGroups(): NavGroup[] {
    return this.navGroups
      .map(g => ({ ...g, items: g.items.filter(i => !i.superAdminOnly || this.isSuperAdmin) }))
      .filter(g => g.items.length > 0);
  }

  toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update((v) => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
