import { Routes } from '@angular/router';
import { ClientDashboardComponent } from './dashboard/client-dashboard.component';
import { ClientGuard } from './guards/client.guard';

export const clientRoutes: Routes = [
  { path: 'dashboard', component: ClientDashboardComponent, canActivate: [ClientGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
