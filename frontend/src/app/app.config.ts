import { ApplicationConfig } from '@angular/core';
import { PreloadAllModules, provideRouter, withPreloading } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
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

function isAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/signin') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh')
  );
}

const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);

  if (req.url.includes('/auth/refresh')) {
    return next(req);
  }

  return authService.ensureValidAccessToken().pipe(
    switchMap((token) => {
      const authReq = token
        ? req.clone({
            setHeaders: { Authorization: `Bearer ${token}` },
          })
        : req;

      return next(authReq).pipe(
        catchError((error: unknown) => {
          const isUnauthorized =
            error instanceof HttpErrorResponse && error.status === 401;
          if (
            !isUnauthorized ||
            isAuthEndpoint(req.url) ||
            !authService.hasValidRefreshToken()
          ) {
            return throwError(() => error);
          }

          return authService.refreshTokens().pipe(
            switchMap((response) => {
              const refreshedToken = response.accessToken;
              if (!refreshedToken) {
                authService.logout();
                return throwError(() => error);
              }

              const retryReq = req.clone({
                setHeaders: { Authorization: `Bearer ${refreshedToken}` },
              });
              return next(retryReq);
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
    provideAnimations(),
    provideHttpClient(
      withInterceptors([authInterceptorFn])
    )
  ]
};
