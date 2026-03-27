import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-employee-layout',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, RouterOutlet],
  template: `
    <div class="employee-shell">
      <aside class="employee-sidebar app-shell-card">
        <div class="employee-brand">Employee Space</div>

        <nav class="employee-nav">
          <a routerLink="/employee/dashboard" routerLinkActive="active">Dashboard</a>
          <a routerLink="/employee/tasks" routerLinkActive="active">Mes tâches</a>
          <a routerLink="/employee/todo/missions" routerLinkActive="active">Missions C'To-Do</a>
          <a routerLink="/employee/agenda" routerLinkActive="active">Mon Agenda</a>
        </nav>

        <button class="logout-btn" type="button" (click)="logout()">
          Deconnexion
        </button>
      </aside>

      <main class="employee-content page-enter">
        <router-outlet></router-outlet>
      </main>
    </div>
  `,
  styles: [
    `
      .employee-shell {
        display: grid;
        grid-template-columns: 220px 1fr;
        gap: 14px;
        min-height: calc(100vh - 118px);
      }

      .employee-sidebar {
        padding: 14px;
        border: 1px solid var(--line);
        display: grid;
        grid-template-rows: auto 1fr auto;
        gap: 12px;
      }

      .employee-brand {
        font-weight: 800;
        color: var(--ink-0);
      }

      .employee-nav {
        display: grid;
        gap: 6px;
      }

      .employee-nav a {
        text-decoration: none;
        color: var(--ink-1);
        border-radius: 10px;
        padding: 9px 10px;
        border: 1px solid transparent;
      }

      .employee-nav a.active {
        color: var(--ink-0);
        background: rgba(15, 138, 119, 0.14);
        border-color: rgba(15, 138, 119, 0.3);
      }

      .logout-btn {
        border: 1px solid var(--line);
        border-radius: 10px;
        background: #fff;
        padding: 9px 10px;
        cursor: pointer;
      }

      @media (max-width: 940px) {
        .employee-shell {
          grid-template-columns: 1fr;
        }
      }
    `,
  ],
})
export class EmployeeLayoutComponent {
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/auth/signin']);
  }
}
