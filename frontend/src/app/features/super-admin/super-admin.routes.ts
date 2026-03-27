import { Routes } from '@angular/router';
import { AdminLayoutComponent } from './layout/admin-layout.component';
import { SuperAdminDashboardComponent } from './dashboard/super-admin-dashboard.component';
import { UsersManagementComponent } from './users/users-management.component';
import { ShopProductsComponent } from './shop/shop-products.component';
import { GrillProductsComponent } from './grill/grill-products.component';
import { GrillMenusComponent } from './grill/grill-menus.component';
import { GrillOrdersComponent } from './grill/grill-orders.component';
import { CleanServicesComponent } from './clean/clean-services.component';
import { CleanBookingsComponent } from './clean/clean-bookings.component';
import { TodoServicesComponent } from './todo/todo-services.component';
import { TodoOrdersComponent } from './todo/todo-orders.component';
import { SectorsComponent } from './sectors/sectors.component';
import { EmployeesManagementComponent } from './employees/employees-management.component';
import { ClientsManagementComponent } from './clients/clients-management.component';
import { OrdersTrackingComponent } from './orders/orders-tracking.component';
import { SuperAdminGuard } from './guards/super-admin.guard';
import { ShopPromotionsComponent } from './shop/shop-promotions.component';
import { ShopOrdersComponent } from './shop/shop-orders.component';
import { SeasonalCampaignsComponent } from './marketing/seasonal-campaigns.component';
import { NewsManagementComponent } from './marketing/news-management.component';
import { FooterSettingsComponent } from './marketing/footer-settings.component';
import { ContentPagesManagementComponent } from './marketing/content-pages-management.component';
import { ExpressDeliveriesManagementComponent } from './express/express-deliveries-management.component';
import { ExpressCouriersManagementComponent } from './express/express-couriers-management.component';
import { ExpressImportExportManagementComponent } from './express/express-import-export-management.component';
import { EventsManagementComponent } from './events/events-management.component';
import { EventsBookingsManagementComponent } from './events/events-bookings-management.component';
import { TasksManagementComponent } from './tasks/tasks-management.component';
import { AdminScheduleComponent } from './schedule/admin-schedule.component';

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
      { path: 'shop/promotions', component: ShopPromotionsComponent },
      { path: 'shop/orders', component: ShopOrdersComponent },
      
      // C'Grill
      { path: 'grill/products', component: GrillProductsComponent },
      { path: 'grill/menus', component: GrillMenusComponent },
      { path: 'grill/orders', component: GrillOrdersComponent },
      
      // C'Clean
      { path: 'clean/services', component: CleanServicesComponent },
      { path: 'clean/bookings', component: CleanBookingsComponent },

      // C'Todo
      { path: 'todo/services', component: TodoServicesComponent },
      { path: 'todo/orders', component: TodoOrdersComponent },
      { path: 'tasks', component: TasksManagementComponent },
      { path: 'schedule', component: AdminScheduleComponent },

      // C'Events
      { path: 'events/catalog', component: EventsManagementComponent },
      { path: 'events/bookings', component: EventsBookingsManagementComponent },

      // C'Express
      { path: 'express/deliveries', component: ExpressDeliveriesManagementComponent },
      { path: 'express/couriers', component: ExpressCouriersManagementComponent },
      { path: 'express/import-export', component: ExpressImportExportManagementComponent },
      
      // Employés et Clients
      { path: 'employees', component: EmployeesManagementComponent },
      { path: 'clients', component: ClientsManagementComponent },
      { path: 'orders', component: OrdersTrackingComponent },
      { path: 'marketing/campaigns', component: SeasonalCampaignsComponent },
      { path: 'marketing/news', component: NewsManagementComponent },
      { path: 'marketing/footer', component: FooterSettingsComponent },
      { path: 'marketing/pages', component: ContentPagesManagementComponent },
      
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
    ]
  }
];
