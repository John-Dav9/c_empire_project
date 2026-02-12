import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../admin/services/admin.service';
import { User, UserRole } from '../../admin/models/admin.models';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  
  users: User[] = [];
  loading = true;
  error: string | null = null;
  
  // Filters
  searchTerm = '';
  selectedRole: UserRole | '' = '';
  selectedStatus: boolean | '' = '';
  
  // Pagination
  currentPage = 1;
  totalPages = 1;
  pageSize = 10;
  totalUsers = 0;

  readonly userRoles = Object.values(UserRole);

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    this.error = null;
    
    const role = this.selectedRole || undefined;
    const isActive = this.selectedStatus === '' ? undefined : this.selectedStatus;
    const search = this.searchTerm.trim() || undefined;

    this.adminService.getUsers(this.currentPage, this.pageSize, search, role, isActive).subscribe({
      next: (response) => {
        this.users = response.data;
        this.totalUsers = response.total;
        this.totalPages = response.totalPages;
        this.currentPage = response.page;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.error = 'Erreur lors du chargement des utilisateurs';
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.currentPage = 1;
    this.loadUsers();
  }

  onFilterChange() {
    this.currentPage = 1;
    this.loadUsers();
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.loadUsers();
    }
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadUsers();
    }
  }

  updateUserRole(userId: string, newRole: UserRole) {
    if (confirm('Êtes-vous sûr de vouloir modifier le rôle de cet utilisateur ?')) {
      this.adminService.updateUserRole(userId, newRole).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error updating role:', error);
          alert('Erreur lors de la mise à jour du rôle');
        }
      });
    }
  }

  toggleUserStatus(userId: string) {
    if (confirm('Êtes-vous sûr de vouloir changer le statut de cet utilisateur ?')) {
      this.adminService.toggleUserStatus(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error toggling status:', error);
          alert('Erreur lors du changement de statut');
        }
      });
    }
  }

  deleteUser(userId: string, userEmail: string) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ? Cette action est irréversible.`)) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => {
          this.loadUsers();
        },
        error: (error) => {
          console.error('Error deleting user:', error);
          alert('Erreur lors de la suppression');
        }
      });
    }
  }

  getRoleBadgeClass(role: string): string {
    switch (role) {
      case 'super_admin': return 'badge-danger';
      case 'admin': return 'badge-warning';
      case 'employee': return 'badge-info';
      case 'client': return 'badge-secondary';
      default: return 'badge-secondary';
    }
  }

  getRoleLabel(role: string): string {
    switch (role) {
      case 'super_admin': return 'Super Admin';
      case 'admin': return 'Admin';
      case 'employee': return 'Employé';
      case 'client': return 'Client';
      default: return role;
    }
  }
}
