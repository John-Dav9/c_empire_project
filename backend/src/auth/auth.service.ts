import {
  BadRequestException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { User } from './entities/user.entity';
import { SignupDto } from 'src/dto/signup.dto';
import { SigninDto } from 'src/dto/signin.dto';
import { randomBytes } from 'crypto';
import { ForgotPasswordDto } from 'src/dto/forgot-password.dto';
import { ResetPasswordDto } from 'src/dto/reset-password.dto';
import { RefreshTokenDto } from 'src/dto/refresh-token.dto';
import { AuthResponse } from 'src/interfaces/auth-response.interface';
import { AuthUser } from 'src/interfaces/auth-user.interface';
import { UserRole } from './enums/user-role.enum';
import { EmailService } from 'src/core/notifications/email/email.service';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly appBaseUrl: string;

  private readonly accessTokenExpiresIn = '15m';
  private readonly refreshTokenExpiresIn = '7d';

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required');
    }
    this.accessTokenSecret = accessSecret;
    this.refreshTokenSecret = refreshSecret;
    this.appBaseUrl = (
      process.env.APP_BASE_URL || 'http://localhost:4200'
    ).replace(/\/+$/, '');
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signup(dto: SignupDto): Promise<AuthResponse> {
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cet email.');
    }

    const hashedPassword = await this.hashPassword(dto.password);

    const user = this.userRepository.create({
      email: dto.email,
      password: hashedPassword,
      firstname: dto.firstname || '',
      lastname: dto.lastname || '',
      phone: dto.phone || '',
      role: UserRole.CLIENT,
      isActive: true,
    });

    const savedUser = await this.userRepository.save(user);

    const tokens = await this.generateTokens(savedUser);

    // On hash le refresh token pour le stocker
    const refreshTokenHash = await this.hashData(tokens.refreshToken);
    savedUser.refreshTokenHash = refreshTokenHash;
    await this.userRepository.save(savedUser);

    return {
      message: 'Compte créé avec succès.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(savedUser),
    };
  }

  /**
   * Connexion utilisateur
   */
  async signin(dto: SigninDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // Vérifier si l'utilisateur est actif
    if (!user.isActive) {
      throw new UnauthorizedException(
        "Votre compte a été désactivé. Contactez l'administrateur.",
      );
    }

    const passwordValid = await this.comparePassword(
      dto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const tokens = await this.generateTokens(user);

    // Mettre à jour le hash du refresh token
    const refreshTokenHash = await this.hashData(tokens.refreshToken);
    user.refreshTokenHash = refreshTokenHash;
    await this.userRepository.save(user);

    return {
      message: 'Connexion réussie.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(user),
    };
  }

  /**
   * Demande de réinitialisation de mot de passe
   */
  async requestPasswordReset(dto: ForgotPasswordDto) {
    const genericResponse = {
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    };
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (!user) {
      return genericResponse;
    }

    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // token valable 1h

    user.resetPasswordToken = token;
    user.resetPasswordExpires = expires;

    await this.userRepository.save(user);

    const resetUrl = this.buildPasswordResetUrl(token);

    if (this.emailService.isConfigured()) {
      try {
        await this.emailService.sendPasswordResetEmail(
          user.email,
          resetUrl,
          expires,
        );
      } catch (error) {
        this.logger.error(
          `Failed to send password reset email to ${user.email}`,
          error instanceof Error ? error.stack : undefined,
        );
        throw new BadRequestException(
          'Le service email est temporairement indisponible. Réessayez plus tard.',
        );
      }

      return genericResponse;
    }

    this.logger.warn(
      `Password reset email not sent because mail transport is not configured for ${user.email}.`,
    );

    if (process.env.NODE_ENV !== 'production') {
      return {
        ...genericResponse,
        devResetUrl: resetUrl,
      };
    }

    return genericResponse;
  }

  /**
   * Réinitialisation du mot de passe
   */
  async resetPassword(dto: ResetPasswordDto) {
    const now = new Date();

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: dto.token,
      },
    });

    if (
      !user ||
      !user.resetPasswordExpires ||
      user.resetPasswordExpires < now
    ) {
      throw new BadRequestException(
        'Lien de réinitialisation invalide ou expiré.',
      );
    }

    const newHashedPassword = await this.hashPassword(dto.newPassword);
    user.password = newHashedPassword;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

    // On peut renvoyer un message simple
    return {
      message: 'Mot de passe réinitialisé avec succès.',
    };
  }

  async validateResetPasswordToken(token: string) {
    if (!token?.trim()) {
      return { valid: false };
    }

    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: token.trim(),
      },
    });

    return {
      valid:
        !!user &&
        !!user.resetPasswordExpires &&
        user.resetPasswordExpires >= new Date(),
    };
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiresIn,
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshTokenSecret,
      expiresIn: this.refreshTokenExpiresIn,
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  private async hashData(data: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(data, saltRounds);
  }

  // refresh tokens

  async refreshTokens(dto: RefreshTokenDto) {
    try {
      const decoded = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.refreshTokenSecret,
      });

      const userId = decoded.sub;

      const user = await this.userRepository.findOne({
        where: { id: userId },
      });

      if (!user || !user.refreshTokenHash) {
        throw new UnauthorizedException('Refresh token invalide.');
      }

      const refreshTokenMatches = await bcrypt.compare(
        dto.refreshToken,
        user.refreshTokenHash,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Refresh token invalide.');
      }

      const tokens = await this.generateTokens(user);

      // On met à jour le nouveau refresh token hashé
      const newRefreshTokenHash = await this.hashData(tokens.refreshToken);
      user.refreshTokenHash = newRefreshTokenHash;
      await this.userRepository.save(user);

      return {
        message: 'Tokens régénérés avec succès.',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (_error) {
      throw new UnauthorizedException('Refresh token invalide ou expiré.');
    }
  }

  async findUserById(id: string): Promise<AuthUser> {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) {
      throw new BadRequestException('Utilisateur introuvable.');
    }
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  // =====================
  // Méthodes privées
  // =====================

  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  private async signToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  private sanitizeUser(user: User): AuthUser {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  private buildPasswordResetUrl(token: string): string {
    return `${this.appBaseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
  }
}
