import { Routes } from '@angular/router';
import { EmployeeDashboardComponent } from './dashboard/employee-dashboard.component';
import { EmployeeGuard } from './guards/employee.guard';
import { EmployeeLayoutComponent } from './layout/employee-layout.component';
import { EmployeeTodoMissionsComponent } from './todo-missions/employee-todo-missions.component';
import { EmployeeAgendaComponent } from './agenda/employee-agenda.component';
import { EmployeeTasksComponent } from './tasks/employee-tasks.component';

export const employeeRoutes: Routes = [
  {
    path: '',
    canActivate: [EmployeeGuard],
    component: EmployeeLayoutComponent,
    children: [
      { path: 'dashboard', component: EmployeeDashboardComponent },
      { path: 'todo/missions', component: EmployeeTodoMissionsComponent },
      { path: 'agenda', component: EmployeeAgendaComponent },
      { path: 'tasks', component: EmployeeTasksComponent },
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
    ],
  },
];
