import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import {
  HttpErrorResponse,
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { routes } from './app.routes';
import { inject } from '@angular/core';
import { AuthService } from './core/services/auth.service';
import { catchError, switchMap } from 'rxjs/operators';
import { throwError } from 'rxjs';

/** Endpoints publics qui ne nécessitent pas de token — l'intercepteur les laisse passer directement. */
function isPublicAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/signin') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}

const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  // Endpoints publics → bypass complet (pas de tentative de refresh)
  if (isPublicAuthEndpoint(req.url)) {
    return next(req);
  }

  const authService = inject(AuthService);

  return authService.ensureValidAccessToken().pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

      return next(authReq).pipe(
        catchError((error: unknown) => {
          const isUnauthorized =
            error instanceof HttpErrorResponse && error.status === 401;

          // Si non-401, ou pas de refresh token valide → propager l'erreur directement
          if (!isUnauthorized || !authService.hasValidRefreshToken()) {
            return throwError(() => error);
          }

          // Tenter un refresh silencieux puis rejouer la requête
          return authService.refreshTokens().pipe(
            switchMap((response) => {
              const refreshedToken = response.accessToken;
              if (!refreshedToken) {
                authService.logout();
                return throwError(() => error);
              }
              return next(
                req.clone({ setHeaders: { Authorization: `Bearer ${refreshedToken}` } }),
              );
            }),
            catchError((refreshError) => {
              authService.logout();
              return throwError(() => refreshError);
            }),
          );
        }),
      );
    }),
  );
};

export const appConfig: ApplicationConfig = {
  providers: [
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideAnimationsAsync(),
    provideHttpClient(
      withInterceptors([authInterceptorFn])
    )
  ]
};
