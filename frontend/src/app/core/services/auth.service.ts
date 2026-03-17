import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, of, throwError } from 'rxjs';
import { catchError, finalize, map, shareReplay, tap } from 'rxjs/operators';
import { buildApiUrl } from '../config/api.config';

export interface User {
  userId: string;
  email: string;
  role: string;
}

export interface AuthResponse {
  user: User;
  accessToken: string;
  refreshToken?: string;
  message?: string;
}

export interface PasswordResetRequestResponse {
  message: string;
  devResetUrl?: string;
}

export interface PasswordResetValidationResponse {
  valid: boolean;
}

type JwtPayload = {
  sub?: string;
  email?: string;
  role?: string;
  exp?: number;
};

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = buildApiUrl('/auth');
  private refreshInFlight$: Observable<string | null> | null = null;
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  private normalizeRole(role: unknown): string {
    if (typeof role !== 'string') return 'client';
    return role.toLowerCase().trim();
  }

  signin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, { email, password })
      .pipe(
        tap(response => this.storeSession(response))
      );
  }

  signup(data: any): Observable<AuthResponse> {
    const payload = {
      email: data.email,
      password: data.password,
      firstname: data.firstName ?? data.firstname ?? '',
      lastname: data.lastName ?? data.lastname ?? '',
      phone: data.phone ?? '',
    };

    return this.http.post<AuthResponse>(`${this.apiUrl}/signup`, payload)
      .pipe(
        tap(response => this.storeSession(response))
      );
  }

  requestPasswordReset(email: string): Observable<PasswordResetRequestResponse> {
    return this.http.post<PasswordResetRequestResponse>(
      `${this.apiUrl}/forgot-password`,
      { email },
    );
  }

  validateResetPasswordToken(
    token: string,
  ): Observable<PasswordResetValidationResponse> {
    return this.http.get<PasswordResetValidationResponse>(
      `${this.apiUrl}/reset-password/validate`,
      {
        params: { token },
      },
    );
  }

  resetPassword(
    token: string,
    newPassword: string,
  ): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(
      `${this.apiUrl}/reset-password`,
      {
        token,
        newPassword,
      },
    );
  }

  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(tap((response) => this.storeSession(response)));
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    return token;
  }

  isAuthenticated(): boolean {
    const authenticated = this.hasValidAccessToken() || this.hasValidRefreshToken();
    if (!authenticated && this.currentUserSubject.value) {
      this.currentUserSubject.next(null);
    }
    return authenticated;
  }

  hasValidAccessToken(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token && !this.isTokenExpired(token);
  }

  hasValidRefreshToken(): boolean {
    const refreshToken = localStorage.getItem('refreshToken');
    return !!refreshToken && !this.isTokenExpired(refreshToken);
  }

  ensureValidAccessToken(): Observable<string | null> {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !this.isTokenExpired(accessToken)) {
      return of(accessToken);
    }

    if (!this.hasValidRefreshToken()) {
      this.logout();
      return of(null);
    }

    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.refreshTokens().pipe(
      map((response) => response.accessToken ?? null),
      catchError(() => {
        this.logout();
        return of(null);
      }),
      finalize(() => {
        this.refreshInFlight$ = null;
      }),
      shareReplay(1),
    );

    return this.refreshInFlight$;
  }

  private loadUser(): User | null {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    const token =
      (accessToken && !this.isTokenExpired(accessToken) ? accessToken : null) ??
      (refreshToken && !this.isTokenExpired(refreshToken) ? refreshToken : null);

    // Évite l'état "profil affiché mais session expirée".
    if (!token) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      return null;
    }

    if (!token) return null;
    const payload = this.decodeToken(token);
    if (!payload?.sub || !payload?.email) {
      return null;
    }

    return {
      userId: payload.sub,
      email: payload.email,
      role: this.normalizeRole(payload.role),
    };
  }

  private storeSession(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    if (response.user) {
      this.currentUserSubject.next({
        ...response.user,
        role: this.normalizeRole(response.user.role),
      });
      return;
    }

    const payload = this.decodeToken(response.accessToken);
    if (payload?.sub && payload?.email) {
      this.currentUserSubject.next({
        userId: payload.sub,
        email: payload.email,
        role: this.normalizeRole(payload.role),
      });
    }
  }

  private decodeToken(token: string): JwtPayload | null {
    try {
      const payloadPart = token.split('.')[1];
      if (!payloadPart) return null;

      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const json = atob(base64 + padding);
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null;
    }
  }

  private isTokenExpired(token: string, skewSeconds = 30): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      return true;
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds + skewSeconds;
  }
}
