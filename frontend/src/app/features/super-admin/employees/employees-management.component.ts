import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

@Component({
  selector: 'app-employees-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="employees-container">
      <div class="header">
        <h1>👷 Gestion des Employés</h1>
      </div>

      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div *ngIf="!loading" class="employees-grid">
        <div *ngFor="let employee of employees" class="employee-card">
          <div class="employee-header">
            <div class="avatar">{{ employee.firstname?.charAt(0) }}{{ employee.lastname?.charAt(0) }}</div>
            <div class="employee-info">
              <h3>{{ employee.firstname }} {{ employee.lastname }}</h3>
              <p>{{ employee.email }}</p>
              <span class="badge" [class.badge-active]="employee.isActive">
                {{ employee.isActive ? 'Actif' : 'Inactif' }}
              </span>
            </div>
          </div>
          <div class="employee-body">
            <div class="info-row">
              <span class="label">📞 Téléphone:</span>
              <span>{{ employee.phone || 'N/A' }}</span>
            </div>
            <div class="info-row">
              <span class="label">🏢 Rôle:</span>
              <span class="badge badge-role">{{ getRoleLabel(employee.role) }}</span>
            </div>
          </div>
          <div class="employee-actions">
            <button class="btn btn-sm" (click)="promoteEmployee(employee)" [disabled]="employee.role === 'admin'">
              ⬆️ Promouvoir
            </button>
            <button class="btn btn-sm btn-secondary" (click)="toggleStatus(employee)">
              {{ employee.isActive ? '🔒 Désactiver' : '🔓 Activer' }}
            </button>
          </div>
        </div>
      </div>

      <div *ngIf="employees.length === 0 && !loading" class="empty-state">
        <p>👷 Aucun employé trouvé</p>
      </div>
    </div>
  `,
  styles: [`
    .employees-container {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }
    }

    .employees-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
      gap: 1.5rem;
    }

    .employee-card {
      background: white;
      border-radius: 12px;
      padding: 1.5rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .employee-header {
        display: flex;
        gap: 1rem;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid #eee;

        .avatar {
          width: 60px;
          height: 60px;
          border-radius: 50%;
          background: linear-gradient(135deg, #dc3545, #c82333);
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
          font-weight: 700;
        }

        .employee-info {
          flex: 1;

          h3 {
            margin: 0 0 0.25rem;
            font-size: 1.125rem;
            font-weight: 600;
          }

          p {
            margin: 0 0 0.5rem;
            color: #666;
            font-size: 0.875rem;
          }
        }
      }

      .employee-body {
        margin-bottom: 1rem;

        .info-row {
          display: flex;
          justify-content: space-between;
          padding: 0.5rem 0;

          .label {
            font-weight: 600;
            color: #666;
          }
        }
      }

      .employee-actions {
        display: flex;
        gap: 0.5rem;
      }
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;

      &.badge-active {
        background: #d4edda;
        color: #155724;
      }

      &.badge-role {
        background: #17a2b8;
        color: white;
      }
    }

    .btn {
      padding: 0.5rem 1rem;
      border: none;
      border-radius: 8px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      flex: 1;
      transition: all 0.2s;

      &:not(.btn-secondary) {
        background: #dc3545;
        color: white;

        &:hover:not(:disabled) {
          background: #c82333;
        }
      }

      &.btn-secondary {
        background: #6c757d;
        color: white;

        &:hover {
          background: #5a6268;
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;

      .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #dc3545;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class EmployeesManagementComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = buildApiUrl('/admin/users');

  employees: any[] = [];
  loading = false;

  ngOnInit() {
    this.loadEmployees();
  }

  loadEmployees() {
    this.loading = true;
    this.http.get<any>(this.apiUrl + '?role=employee').subscribe({
      next: (response) => {
        this.employees = response.data || [];
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      }
    });
  }

  promoteEmployee(employee: any) {
    if (confirm(`Promouvoir ${employee.firstname} ${employee.lastname} au rôle d'admin ?`)) {
      this.http.patch(`${this.apiUrl}/${employee.id}/role`, { role: 'admin' }).subscribe({
        next: () => this.loadEmployees()
      });
    }
  }

  toggleStatus(employee: any) {
    this.http.patch(`${this.apiUrl}/${employee.id}/toggle-status`, {}).subscribe({
      next: () => this.loadEmployees()
    });
  }

  getRoleLabel(role: string): string {
    const labels: any = {
      'employee': 'Employé',
      'admin': 'Administrateur',
      'super_admin': 'Super Admin'
    };
    return labels[role] || role;
  }
}
