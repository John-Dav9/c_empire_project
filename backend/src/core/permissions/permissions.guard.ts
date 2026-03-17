import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';
import { UserRole } from 'src/auth/enums/user-role.enum';
import { ROLE_PERMISSIONS } from './permissions.map';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();

    if (request.method === 'OPTIONS') {
      return true;
    }

    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const role = request.user?.role as UserRole | undefined;
    if (!role) {
      return false;
    }

    const grantedPermissions = ROLE_PERMISSIONS[role] ?? [];
    if (grantedPermissions.includes('*')) {
      return true;
    }

    return requiredPermissions.every((permission) =>
      grantedPermissions.includes(permission),
    );
  }
}
