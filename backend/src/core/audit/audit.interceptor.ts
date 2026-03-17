import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common';
import { Observable, tap } from 'rxjs';
import { UserRole } from 'src/auth/enums/user-role.enum';

@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger('Audit');

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const role = request.user?.role as UserRole | undefined;
    const method = String(request.method ?? 'GET').toUpperCase();
    const mutableMethods = ['POST', 'PUT', 'PATCH', 'DELETE'];
    const isAdminRole =
      role === UserRole.ADMIN || role === UserRole.SUPER_ADMIN;
    const shouldAudit = isAdminRole && mutableMethods.includes(method);

    const startedAt = Date.now();

    return next.handle().pipe(
      tap({
        next: () => {
          if (!shouldAudit) return;
          this.logger.log(
            JSON.stringify({
              actorId: request.user?.userId ?? request.user?.id,
              actorRole: role,
              method,
              path: request.originalUrl ?? request.url,
              statusCode: request.res?.statusCode,
              durationMs: Date.now() - startedAt,
            }),
          );
        },
      }),
    );
  }
}
