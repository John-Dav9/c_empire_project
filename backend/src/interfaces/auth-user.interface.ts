import { UserRole } from 'src/auth/enums/user-role.enum';

export interface AuthUser {
  id?: string;
  sub?: string;
  userId: string;
  email: string;
  role: UserRole;
}
