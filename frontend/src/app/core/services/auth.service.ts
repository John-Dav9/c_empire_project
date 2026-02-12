import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly apiUrl = buildApiUrl('/auth');
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
        tap(response => {
          localStorage.setItem('accessToken', response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
          this.currentUserSubject.next({
            ...response.user,
            role: this.normalizeRole(response.user?.role),
          });
        })
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
        tap(response => {
          localStorage.setItem('accessToken', response.accessToken);
          if (response.refreshToken) {
            localStorage.setItem('refreshToken', response.refreshToken);
          }
          this.currentUserSubject.next({
            ...response.user,
            role: this.normalizeRole(response.user?.role),
          });
        })
      );
  }

  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null);
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  private loadUser(): User | null {
    const token = localStorage.getItem('accessToken');
    if (!token) return null;
    // Decoder le JWT pour récupérer les infos utilisateur
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return {
        userId: payload.sub,
        email: payload.email,
        role: this.normalizeRole(payload.role)
      };
    } catch {
      return null;
    }
  }
}
