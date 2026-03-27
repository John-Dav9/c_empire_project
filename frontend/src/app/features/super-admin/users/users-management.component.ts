import { Component, OnInit, inject } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AdminService } from '../../admin/services/admin.service';
import { User, UserRole, EmployeeSpecialty } from '../../admin/models/admin.models';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-users-management',
  imports: [DatePipe, FormsModule],
  templateUrl: './users-management.component.html',
  styleUrls: ['./users-management.component.scss']
})
export class UsersManagementComponent implements OnInit {
  private adminService = inject(AdminService);
  private authService = inject(AuthService);

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

  // Role change modal
  showRoleModal = false;
  roleModalUser: User | null = null;
  selectedNewRole: UserRole | '' = '';
  selectedSpecialty: EmployeeSpecialty | '' = '';
  savingRole = false;

  readonly userRoles = Object.values(UserRole);
  readonly UserRole = UserRole;
  readonly EmployeeSpecialty = EmployeeSpecialty;
  readonly specialtyOptions = Object.values(EmployeeSpecialty);

  get isSuperAdmin(): boolean {
    return this.authService.getCurrentUser()?.role === 'super_admin';
  }

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
      error: () => {
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

  openRoleModal(user: User) {
    this.roleModalUser = user;
    this.selectedNewRole = user.role;
    this.selectedSpecialty = user.specialty ?? '';
    this.showRoleModal = true;
  }

  closeRoleModal() {
    this.showRoleModal = false;
    this.roleModalUser = null;
    this.selectedNewRole = '';
    this.selectedSpecialty = '';
  }

  saveRoleChange() {
    if (!this.roleModalUser || !this.selectedNewRole) return;
    const specialty = this.selectedNewRole === UserRole.EMPLOYEE && this.selectedSpecialty
      ? (this.selectedSpecialty as EmployeeSpecialty)
      : undefined;

    this.savingRole = true;
    this.adminService.updateUserRole(this.roleModalUser.id, this.selectedNewRole as UserRole, specialty).subscribe({
      next: () => {
        this.closeRoleModal();
        this.loadUsers();
        this.savingRole = false;
      },
      error: (err) => {
        alert(`Erreur: ${err.error?.message || 'Impossible de modifier le rôle'}`);
        this.savingRole = false;
      }
    });
  }

  toggleUserStatus(userId: string) {
    if (confirm('Êtes-vous sûr de vouloir changer le statut de cet utilisateur ?')) {
      this.adminService.toggleUserStatus(userId).subscribe({
        next: () => this.loadUsers(),
        error: () => alert('Erreur lors du changement de statut')
      });
    }
  }

  deleteUser(userId: string, userEmail: string) {
    if (confirm(`Êtes-vous sûr de vouloir supprimer l'utilisateur ${userEmail} ? Cette action est irréversible.`)) {
      this.adminService.deleteUser(userId).subscribe({
        next: () => this.loadUsers(),
        error: () => alert('Erreur lors de la suppression')
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

  getSpecialtyLabel(specialty: string): string {
    switch (specialty) {
      case 'livreur': return 'Livreur';
      case 'evenementialiste': return 'Évènementialiste';
      case 'coursier': return 'Coursier';
      case 'nettoyeur': return 'Nettoyeur';
      case 'bricoleur': return 'Bricoleur';
      case 'point_relais': return 'Point Relais';
      default: return specialty;
    }
  }
}
