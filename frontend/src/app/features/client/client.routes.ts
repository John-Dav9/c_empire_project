import { Routes } from '@angular/router';
import { ClientDashboardComponent } from './dashboard/client-dashboard.component';
import { ClientGuard } from './guards/client.guard';
import { ClientEventsBookingsComponent } from './events-bookings/client-events-bookings.component';
import { ClientTodoRequestsComponent } from './todo-requests/client-todo-requests.component';
import { ClientShopOrdersComponent } from './shop-orders/client-shop-orders.component';
import { ClientCleanBookingsComponent } from './clean-bookings/client-clean-bookings.component';
import { ClientGrillOrdersComponent } from './grill-orders/client-grill-orders.component';

export const clientRoutes: Routes = [
  { path: 'dashboard', component: ClientDashboardComponent, canActivate: [ClientGuard] },
  { path: 'shop/orders', component: ClientShopOrdersComponent, canActivate: [ClientGuard] },
  { path: 'events/bookings', component: ClientEventsBookingsComponent, canActivate: [ClientGuard] },
  { path: 'todo/requests', component: ClientTodoRequestsComponent, canActivate: [ClientGuard] },
  { path: 'clean/bookings', component: ClientCleanBookingsComponent, canActivate: [ClientGuard] },
  { path: 'grill/orders', component: ClientGrillOrdersComponent, canActivate: [ClientGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
