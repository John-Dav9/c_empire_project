export enum UserRole {
  CLIENT = 'client',
  EMPLOYEE = 'employee',
  ADMIN = 'admin',
  SUPER_ADMIN = 'super_admin',
}

export enum EmployeeSpecialty {
  LIVREUR = 'livreur',
  EVENEMENTIALISTE = 'evenementialiste',
  COURSIER = 'coursier',
  NETTOYEUR = 'nettoyeur',
  BRICOLEUR = 'bricoleur',
  POINT_RELAIS = 'point_relais',
}

export interface User {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone: string;
  role: UserRole;
  specialty?: EmployeeSpecialty | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserListResponse {
  data: User[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AdminStats {
  totalUsers: number;
  activeUsers: number;
  inactiveUsers: number;
  adminCount: number;
  superAdminCount: number;
  employeeCount: number;
  clientCount: number;
  newUsersThisMonth: number;
}
