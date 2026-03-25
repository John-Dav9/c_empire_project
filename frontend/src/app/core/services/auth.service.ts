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
  providedIn: 'root' // Singleton partagé dans toute l'application
})
export class AuthService {
  private readonly apiUrl = buildApiUrl('/auth'); // Ex: https://api.cempire.com/api/auth

  // Empêche les appels parallèles de refresh : un seul appel en vol à la fois
  // Si deux requêtes déclenchent un refresh simultanément, elles partagent le même Observable
  private refreshInFlight$: Observable<string | null> | null = null;

  // Source de vérité de l'état de connexion — initialisée depuis localStorage au démarrage
  private currentUserSubject = new BehaviorSubject<User | null>(this.loadUser());
  // Observable public pour que les composants s'y abonnent (header, guards, etc.)
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor(private http: HttpClient) {}

  /** Normalise le rôle en minuscules — protège contre les variations ('Admin', 'ADMIN', 'admin') */
  private normalizeRole(role: unknown): string {
    if (typeof role !== 'string') return 'client';
    return role.toLowerCase().trim();
  }

  /** Appelle POST /auth/signin et stocke la session (tokens + user) en localStorage */
  signin(email: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/signin`, { email, password })
      .pipe(
        tap(response => this.storeSession(response)) // Côté effet : stocke les tokens dès réception
      );
  }

  /**
   * Appelle POST /auth/signup.
   * Normalise les noms de champs (firstName/firstname) pour compatibilité avec différents formulaires.
   */
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

  /** Renouvelle l'access token via le refresh token stocké en localStorage */
  refreshTokens(): Observable<AuthResponse> {
    const refreshToken = localStorage.getItem('refreshToken');
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh`, { refreshToken })
      .pipe(tap((response) => this.storeSession(response))); // Met à jour les tokens en localStorage
  }

  /** Déconnecte l'utilisateur : supprime les tokens et vide l'état courant */
  logout(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    this.currentUserSubject.next(null); // Notifie tous les abonnés (header, guards, etc.)
  }

  /** Retourne l'utilisateur courant uniquement si la session est encore valide */
  getCurrentUser(): User | null {
    if (!this.isAuthenticated()) {
      return null;
    }
    return this.currentUserSubject.value;
  }

  /** Retourne l'access token s'il est valide, null sinon */
  getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    if (!token || this.isTokenExpired(token)) {
      return null;
    }
    return token;
  }

  /**
   * Vérifie si l'utilisateur est authentifié.
   * Un refresh token valide suffit — l'intercepteur renouvellera l'access token si besoin.
   * Si aucun token valide, vide l'état courant pour éviter un état incohérent.
   */
  isAuthenticated(): boolean {
    const authenticated = this.hasValidAccessToken() || this.hasValidRefreshToken();
    if (!authenticated && this.currentUserSubject.value) {
      this.currentUserSubject.next(null); // Nettoie l'état si la session a expiré
    }
    return authenticated;
  }

  /** Vérifie que l'access token existe et n'est pas expiré */
  hasValidAccessToken(): boolean {
    const token = localStorage.getItem('accessToken');
    return !!token && !this.isTokenExpired(token);
  }

  /** Vérifie que le refresh token existe et n'est pas expiré */
  hasValidRefreshToken(): boolean {
    const refreshToken = localStorage.getItem('refreshToken');
    return !!refreshToken && !this.isTokenExpired(refreshToken);
  }

  /**
   * Garantit la disponibilité d'un access token valide avant une requête protégée.
   * Utilisé par l'intercepteur HTTP pour injecter le token Authorization.
   *
   * Logique :
   * 1. Access token valide → le retourne directement
   * 2. Access token expiré + refresh token valide → lance un refresh (une seule tentative)
   * 3. Aucun token valide → logout + retourne null
   *
   * shareReplay(1) : si plusieurs requêtes simultanées déclenchent un refresh,
   * elles partagent toutes le même Observable au lieu de créer N appels /auth/refresh
   */
  ensureValidAccessToken(): Observable<string | null> {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken && !this.isTokenExpired(accessToken)) {
      return of(accessToken); // Token encore valide → pas de refresh nécessaire
    }

    if (!this.hasValidRefreshToken()) {
      this.logout(); // Session complètement expirée → déconnexion
      return of(null);
    }

    // Évite les appels parallèles : réutilise le refresh en cours s'il existe
    if (this.refreshInFlight$) {
      return this.refreshInFlight$;
    }

    this.refreshInFlight$ = this.refreshTokens().pipe(
      map((response) => response.accessToken ?? null),
      catchError(() => {
        this.logout(); // Refresh échoué → session invalide → déconnexion
        return of(null);
      }),
      finalize(() => {
        this.refreshInFlight$ = null; // Libère le verrou une fois le refresh terminé
      }),
      shareReplay(1), // Partage le résultat entre tous les abonnés concurrents
    );

    return this.refreshInFlight$;
  }

  /**
   * Restaure la session au démarrage de l'application depuis localStorage.
   * Préfère l'access token (plus frais), tombe en fallback sur le refresh token.
   * Retourne null si les deux sont expirés → utilisateur considéré déconnecté.
   */
  private loadUser(): User | null {
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    // Choisit le token le plus pertinent disponible (access > refresh)
    const token =
      (accessToken && !this.isTokenExpired(accessToken) ? accessToken : null) ??
      (refreshToken && !this.isTokenExpired(refreshToken) ? refreshToken : null);

    // Nettoie le localStorage si la session est entièrement expirée
    // → évite l'état incohérent "profil affiché mais appels API échoués"
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

  /**
   * Persiste la session après signin/signup/refresh.
   * Priorité pour l'identité utilisateur : réponse API > décodage du token JWT.
   */
  private storeSession(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    if (response.refreshToken) {
      localStorage.setItem('refreshToken', response.refreshToken);
    }

    // Si l'API retourne l'objet user directement → l'utilise (plus fiable)
    if (response.user) {
      this.currentUserSubject.next({
        ...response.user,
        role: this.normalizeRole(response.user.role),
      });
      return;
    }

    // Fallback : décode le token JWT pour extraire les infos utilisateur
    const payload = this.decodeToken(response.accessToken);
    if (payload?.sub && payload?.email) {
      this.currentUserSubject.next({
        userId: payload.sub,
        email: payload.email,
        role: this.normalizeRole(payload.role),
      });
    }
  }

  /**
   * Décode la partie payload d'un JWT (format base64url).
   * Remarque : ne VÉRIFIE PAS la signature — côté client c'est suffisant
   * car la vérification de signature est faite par le backend à chaque requête.
   */
  private decodeToken(token: string): JwtPayload | null {
    try {
      const payloadPart = token.split('.')[1]; // JWT = header.payload.signature
      if (!payloadPart) return null;

      // Base64url → base64 standard (remplacement de - et _ + ajout du padding)
      const base64 = payloadPart.replace(/-/g, '+').replace(/_/g, '/');
      const padding = '='.repeat((4 - (base64.length % 4)) % 4);
      const json = atob(base64 + padding); // Décode le base64 en JSON
      return JSON.parse(json) as JwtPayload;
    } catch {
      return null; // Token malformé → traité comme invalide
    }
  }

  /**
   * Vérifie si un token JWT est expiré.
   * skewSeconds=30 : marge de 30s pour compenser les décalages d'horloge client/serveur
   * → un token expirant dans moins de 30s est considéré expiré (refresh préventif)
   */
  private isTokenExpired(token: string, skewSeconds = 30): boolean {
    const payload = this.decodeToken(token);
    if (!payload?.exp) {
      return true; // Pas de date d'expiration → considéré expiré
    }
    const nowInSeconds = Math.floor(Date.now() / 1000);
    return payload.exp <= nowInSeconds + skewSeconds;
  }
}
