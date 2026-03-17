import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { JwtPayload } from '../interfaces/jwt-payload.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor() {
    const accessSecret =
      process.env.JWT_ACCESS_SECRET ?? process.env.JWT_SECRET;
    if (!accessSecret) {
      throw new Error('JWT_ACCESS_SECRET or JWT_SECRET is required');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(), // récupère le token dans Authorization: Bearer xxx
      ignoreExpiration: false,
      secretOrKey: accessSecret,
    });
  }

  /**
   * Cette méthode est appelée AUTOMATIQUEMENT si le token est valide.
   * Ce qu’elle retourne sera injecté dans req.user
   */
  async validate(payload: JwtPayload): Promise<AuthUser> {
    const authUser: AuthUser = {
      // Compat legacy: plusieurs contrôleurs lisent encore req.user.id ou req.user.sub
      id: payload.sub,
      sub: payload.sub,
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
    return authUser;
  }
}
