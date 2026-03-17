import { AuthUser } from './auth-user.interface';

export interface AuthTokens {
  accessToken: string;
  refreshToken?: string;
}

export interface AuthResponse extends AuthTokens {
  message: string;
  user: AuthUser;
}
