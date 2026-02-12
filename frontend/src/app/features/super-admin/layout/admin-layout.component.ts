import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface NavItem {
  icon: string;
  label: string;
  route: string;
  superAdminOnly?: boolean;
  children?: NavItem[];
}

@Component({
  selector: 'app-admin-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './admin-layout.component.html',
  styleUrl: './admin-layout.component.scss'
})
export class AdminLayoutComponent {
  private authService = inject(AuthService);
  private router = inject(Router);
  
  sidebarCollapsed = false;
  currentUser = this.authService.getCurrentUser();
  isSuperAdmin = this.currentUser?.role === 'super_admin';

  navItems: NavItem[] = [
    {
      icon: '📊',
      label: 'Tableau de bord',
      route: '/super-admin/dashboard'
    },
    {
      icon: '👥',
      label: 'Utilisateurs',
      route: '/super-admin/users'
    },
    {
      icon: '🏢',
      label: 'Secteurs',
      route: '/super-admin/sectors',
      superAdminOnly: true
    },
    {
      icon: '🛍️',
      label: 'Produits C\'Shop',
      route: '/super-admin/shop/products'
    },
    {
      icon: '🍖',
      label: 'Produits C\'Grill',
      route: '/super-admin/grill/products'
    },
    {
      icon: '🍱',
      label: 'Menus C\'Grill',
      route: '/super-admin/grill/menus'
    },
    {
      icon: '🧹',
      label: 'Services C\'Clean',
      route: '/super-admin/clean/services'
    },
    {
      icon: '🔧',
      label: 'Services C\'Todo',
      route: '/super-admin/todo/services'
    },
    {
      icon: '👷',
      label: 'Employés',
      route: '/super-admin/employees'
    },
    {
      icon: '🛒',
      label: 'Clients',
      route: '/super-admin/clients'
    },
    {
      icon: '📦',
      label: 'Toutes les Commandes',
      route: '/super-admin/orders'
    }
  ];

  getVisibleNavItems(): NavItem[] {
    return this.navItems.filter(item => !item.superAdminOnly || this.isSuperAdmin);
  }

  toggleSidebar() {
    this.sidebarCollapsed = !this.sidebarCollapsed;
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
