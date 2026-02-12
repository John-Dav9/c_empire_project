import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../../services/admin.service';
import { User, UserRole } from '../../../models/admin.models';

@Component({
  selector: 'app-user-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './user-list.component.html',
  styleUrls: ['./user-list.component.scss']
})
export class UserListComponent implements OnInit {
  users: User[] = [];
  loading = true;
  searchTerm = '';
  roleFilter: UserRole | '' = '';
  statusFilter: string = '';
  
  page = 1;
  limit = 10;
  total = 0;
  totalPages = 0;

  UserRole = UserRole;

  constructor(private adminService: AdminService) {}

  ngOnInit() {
    this.loadUsers();
  }

  loadUsers() {
    this.loading = true;
    const isActive = this.statusFilter === 'active' ? true : this.statusFilter === 'inactive' ? false : undefined;
    
    this.adminService.getUsers(
      this.page,
      this.limit,
      this.searchTerm || undefined,
      this.roleFilter || undefined,
      isActive
    ).subscribe({
      next: (response) => {
        this.users = response.data;
        this.total = response.total;
        this.totalPages = response.totalPages;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading users:', error);
        this.loading = false;
      }
    });
  }

  onSearch() {
    this.page = 1;
    this.loadUsers();
  }

  onFilterChange() {
    this.page = 1;
    this.loadUsers();
  }

  changePage(newPage: number) {
    if (newPage >= 1 && newPage <= this.totalPages) {
      this.page = newPage;
      this.loadUsers();
    }
  }

  getRoleBadgeClass(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'badge-super-admin';
      case UserRole.ADMIN:
        return 'badge-admin';
      case UserRole.EMPLOYEE:
        return 'badge-employee';
      case UserRole.CLIENT:
        return 'badge-client';
      default:
        return 'badge-client';
    }
  }

  getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.SUPER_ADMIN:
        return 'Super Admin';
      case UserRole.ADMIN:
        return 'Admin';
      case UserRole.EMPLOYEE:
        return 'Employé';
      case UserRole.CLIENT:
        return 'Client';
      default:
        return 'Client';
    }
  }

  promoteUser(user: User) {
    if (confirm(`Promouvoir ${user.email} en Admin ?`)) {
      this.adminService.updateUserRole(user.id, UserRole.ADMIN).subscribe({
        next: () => {
          this.loadUsers();
          alert('Utilisateur promu avec succès');
        },
        error: (error) => {
          alert('Erreur: ' + (error.error?.message || 'Impossible de promouvoir l\'utilisateur'));
        }
      });
    }
  }

  demoteUser(user: User) {
    if (confirm(`Rétrograder ${user.email} en Client ?`)) {
      this.adminService.updateUserRole(user.id, UserRole.CLIENT).subscribe({
        next: () => {
          this.loadUsers();
          alert('Utilisateur rétrogradé avec succès');
        },
        error: (error) => {
          alert('Erreur: ' + (error.error?.message || 'Impossible de rétrograder l\'utilisateur'));
        }
      });
    }
  }

  toggleUserStatus(user: User) {
    const action = user.isActive ? 'désactiver' : 'activer';
    if (confirm(`Voulez-vous ${action} ${user.email} ?`)) {
      this.adminService.toggleUserStatus(user.id).subscribe({
        next: () => {
          this.loadUsers();
          alert(`Utilisateur ${action === 'désactiver' ? 'désactivé' : 'activé'} avec succès`);
        },
        error: (error) => {
          alert('Erreur: ' + (error.error?.message || `Impossible de ${action} l'utilisateur`));
        }
      });
    }
  }

  deleteUser(user: User) {
    if (confirm(`⚠️ ATTENTION: Supprimer définitivement ${user.email} ? Cette action est irréversible.`)) {
      this.adminService.deleteUser(user.id).subscribe({
        next: () => {
          this.loadUsers();
          alert('Utilisateur supprimé avec succès');
        },
        error: (error) => {
          alert('Erreur: ' + (error.error?.message || 'Impossible de supprimer l\'utilisateur'));
        }
      });
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }
}
