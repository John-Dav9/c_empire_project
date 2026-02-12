import { Routes } from '@angular/router';
import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { EmployeeGuard } from './guards/employee.guard';

export const employeeRoutes: Routes = [
  { path: 'dashboard', component: EmployeeDashboardComponent, canActivate: [EmployeeGuard] },
  { path: '', redirectTo: 'dashboard', pathMatch: 'full' }
];
