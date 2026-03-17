// src/core/roles/roles.guard.ts
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';
import { IS_PUBLIC_KEY } from 'src/auth/decorators/public.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  private toRoleName(role: unknown): string | null {
    if (typeof role === 'string') {
      return role;
    }
    if (role && typeof role === 'object' && 'name' in role) {
      const name = (role as { name?: unknown }).name;
      return typeof name === 'string' ? name : null;
    }
    return null;
  }

  // Récupère les rôles définis sur la route via le décorateur @Roles
  canActivate(ctx: ExecutionContext): boolean {
    const request = ctx.switchToHttp().getRequest();

    // Skip guard for OPTIONS (CORS preflight)
    if (request.method === 'OPTIONS') {
      return true;
    }

    // Skip guard if route is public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      ctx.getHandler(),
      ctx.getClass(),
    ]);
    if (isPublic) {
      return true;
    }

    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [ctx.getHandler(), ctx.getClass()],
    );

    // Aucune contrainte → autorisé
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user = request.user; // injecté par JwtAuthGuard global

    // Sans utilisateur, accès refusé (JwtAuthGuard aurait dû poser user)
    if (!user) {
      return false;
    }

    // Supporte soit user.roles (array), soit user.role (string)
    const derivedRoles = Array.isArray(user.roles)
      ? user.roles
          .map((role: unknown) => this.toRoleName(role))
          .filter((role): role is string => Boolean(role))
      : [];
    const userRoles = derivedRoles.concat(
      typeof user.role === 'string' ? [user.role] : [],
    );

    return requiredRoles.some((role) => userRoles.includes(role));
  }
}
