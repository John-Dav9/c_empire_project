import { Routes } from '@angular/router';
import { ClientDashboardComponent } from './dashboard/client-dashboard.component';
import { ClientGuard } from './guards/client.guard';
import { ClientEventsBookingsComponent } from './events-bookings/client-events-bookings.component';
import { ClientTodoRequestsComponent } from './todo-requests/client-todo-requests.component';

export const clientRoutes: Routes = [
  { path: 'dashboard', component: ClientDashboardComponent, canActivate: [ClientGuard] },
  { path: 'events/bookings', component: ClientEventsBookingsComponent, canActivate: [ClientGuard] },
  { path: 'todo/requests', component: ClientTodoRequestsComponent, canActivate: [ClientGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
