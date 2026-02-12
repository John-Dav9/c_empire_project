import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl } from '../../../core/config/api.config';

interface AdminStats {
  totalUsers: number;
  totalOrders: number;
  totalRevenue: number;
  totalProducts: number;
  activeUsers?: number;
  pendingOrders?: number;
  superAdminCount?: number;
  newUsersThisMonth?: number;
}

@Component({
  selector: 'app-super-admin-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './super-admin-dashboard.component.html',
  styleUrls: ['./super-admin-dashboard.component.scss']
})
export class SuperAdminDashboardComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  
  stats: AdminStats | null = null;
  loading = true;
  error: string | null = null;

  ngOnInit() {
    this.loadStats();
  }

  loadStats() {
    this.loading = true;
    this.error = null;
    this.http.get<AdminStats>(buildApiUrl('/admin/stats')).subscribe({
      next: (stats: AdminStats) => {
        this.stats = stats;
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Error loading stats:', error);
        this.loading = false;
        this.error = 'Erreur lors du chargement des statistiques';
      }
    });
  }

  navigateToUsers() {
    this.router.navigate(['/super-admin/users']);
  }

  navigateToSectors() {
    this.router.navigate(['/super-admin/sectors']);
  }

  navigateToTasks() {
    this.router.navigate(['/super-admin/tasks']);
  }

  navigateToPromotions() {
    this.router.navigate(['/super-admin/promotions']);
  }

  navigateToStats() {
    this.router.navigate(['/super-admin/statistics']);
  }

  navigateToLogs() {
    this.router.navigate(['/super-admin/logs']);
  }
}
