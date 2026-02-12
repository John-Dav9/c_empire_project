import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { SuperAdminDashboardComponent } from './dashboard/super-admin-dashboard.component';
import { UsersManagementComponent } from './users/users-management.component';
import { ShopProductsComponent } from './shop/shop-products.component';
import { GrillProductsComponent } from './grill/grill-products.component';
import { GrillMenusComponent } from './grill/grill-menus.component';
import { CleanServicesComponent } from './clean/clean-services.component';
import { TodoServicesComponent } from './todo/todo-services.component';
import { SectorsComponent } from './sectors/sectors.component';
import { EmployeesManagementComponent } from './employees/employees-management.component';
import { ClientsManagementComponent } from './clients/clients-management.component';
import { OrdersTrackingComponent } from './orders/orders-tracking.component';
import { SuperAdminGuard } from './guards/super-admin.guard';

export const superAdminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [SuperAdminGuard],
    children: [
      { path: 'dashboard', component: SuperAdminDashboardComponent },
      { path: 'users', component: UsersManagementComponent },
      { path: 'sectors', component: SectorsComponent },
      
      // C'Shop
      { path: 'shop/products', component: ShopProductsComponent },
      
      // C'Grill
      { path: 'grill/products', component: GrillProductsComponent },
      { path: 'grill/menus', component: GrillMenusComponent },
      
      // C'Clean
      { path: 'clean/services', component: CleanServicesComponent },
      
      // C'Todo
      { path: 'todo/services', component: TodoServicesComponent },
      
      // Employés et Clients
      { path: 'employees', component: EmployeesManagementComponent },
      { path: 'clients', component: ClientsManagementComponent },
      { path: 'orders', component: OrdersTrackingComponent },
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
