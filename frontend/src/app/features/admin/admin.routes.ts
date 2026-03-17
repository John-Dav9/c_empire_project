import { Routes } from '@angular/router';
import { AdminGuard } from './guards/admin.guard';
import { AdminAreaLayoutComponent } from './layout/admin-area-layout.component';

export const adminRoutes: Routes = [
  {
    path: '',
    canActivate: [AdminGuard],
    component: AdminAreaLayoutComponent,
    children: [
      {
        path: 'dashboard',
        loadComponent: () => import('./pages/dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent)
      },
      {
        path: 'users',
        loadComponent: () => import('./pages/users/user-list/user-list.component').then(m => m.UserListComponent)
      },
      {
        path: 'shop/products',
        loadComponent: () =>
          import('../super-admin/shop/shop-products.component').then(
            (m) => m.ShopProductsComponent,
          ),
      },
      {
        path: 'shop/promotions',
        loadComponent: () =>
          import('../super-admin/shop/shop-promotions.component').then(
            (m) => m.ShopPromotionsComponent,
          ),
      },
      {
        path: 'express/deliveries',
        loadComponent: () =>
          import('../super-admin/express/express-deliveries-management.component').then(
            (m) => m.ExpressDeliveriesManagementComponent,
          ),
      },
      {
        path: 'express/couriers',
        loadComponent: () =>
          import('../super-admin/express/express-couriers-management.component').then(
            (m) => m.ExpressCouriersManagementComponent,
          ),
      },
      {
        path: 'express/import-export',
        loadComponent: () =>
          import('../super-admin/express/express-import-export-management.component').then(
            (m) => m.ExpressImportExportManagementComponent,
          ),
      },
      {
        path: 'events/catalog',
        loadComponent: () =>
          import('../super-admin/events/events-management.component').then(
            (m) => m.EventsManagementComponent,
          ),
      },
      {
        path: 'events/bookings',
        loadComponent: () =>
          import('../super-admin/events/events-bookings-management.component').then(
            (m) => m.EventsBookingsManagementComponent,
          ),
      },
      {
        path: 'marketing/pages',
        loadComponent: () =>
          import('../super-admin/marketing/content-pages-management.component').then(
            (m) => m.ContentPagesManagementComponent,
          ),
      },
      {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full'
      }
    ]
  }
];
