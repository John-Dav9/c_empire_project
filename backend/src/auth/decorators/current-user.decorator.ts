import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthUser } from 'src/interfaces/auth-user.interface';

/**
 * Decorator to extract the authenticated user (or a specific field) from the request.
 *
 * Usage:
 *   @CurrentUser()              → full AuthUser object
 *   @CurrentUser('userId')      → user.userId (string)
 *   @CurrentUser('email')       → user.email (string)
 *   @CurrentUser('role')        → user.role (UserRole)
 */
export const CurrentUser = createParamDecorator(
  (field: keyof AuthUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user: AuthUser = request.user;
    if (!field) return user;
    return user?.[field];
  },
);
