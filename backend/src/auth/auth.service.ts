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

  // Durées de vie des tokens : court pour l'access (sécurité), long pour le refresh (confort)
  private readonly accessTokenExpiresIn = '15m'; // Expire vite → limite la fenêtre d'attaque si volé
  private readonly refreshTokenExpiresIn = '7d'; // Permet de rester connecté une semaine

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly jwtService: JwtService,
    private readonly emailService: EmailService,
  ) {
    const accessSecret = process.env.JWT_ACCESS_SECRET;
    const refreshSecret = process.env.JWT_REFRESH_SECRET;
    // Fail-fast au démarrage : impossible de fonctionner sans les secrets JWT
    if (!accessSecret || !refreshSecret) {
      throw new Error('JWT_ACCESS_SECRET and JWT_REFRESH_SECRET are required');
    }
    this.accessTokenSecret = accessSecret;
    this.refreshTokenSecret = refreshSecret;
    // Supprime le slash final pour éviter les URLs doubles (ex: //auth/reset-password)
    this.appBaseUrl = (
      process.env.APP_BASE_URL || 'http://localhost:4200'
    ).replace(/\/+$/, '');
  }

  /**
   * Inscription d'un nouvel utilisateur
   */
  async signup(dto: SignupDto): Promise<AuthResponse> {
    // Vérifie l'unicité de l'email avant toute création
    const existing = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    if (existing) {
      throw new BadRequestException('Un compte existe déjà avec cet email.');
    }

    // Hash le mot de passe avec bcrypt (10 rounds) avant de le stocker
    const hashedPassword = await this.hashPassword(dto.password);

    // Tous les nouveaux comptes créés via signup ont le rôle CLIENT par défaut
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

    // Génère access + refresh tokens avec les secrets JWT
    const tokens = await this.generateTokens(savedUser);

    // Stocke le hash du refresh token en base (jamais le token brut) pour pouvoir
    // le vérifier plus tard sans exposer le token réel en cas de fuite DB
    const refreshTokenHash = await this.hashData(tokens.refreshToken);
    savedUser.refreshTokenHash = refreshTokenHash;
    await this.userRepository.save(savedUser);

    return {
      message: 'Compte créé avec succès.',
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: this.sanitizeUser(savedUser), // Supprime password, refreshTokenHash, etc. de la réponse
    };
  }

  /**
   * Connexion utilisateur
   */
  async signin(dto: SigninDto): Promise<AuthResponse> {
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    // Message générique intentionnel : ne pas révéler si l'email existe en base
    if (!user) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    // Un compte désactivé par un admin ne peut plus se connecter
    if (!user.isActive) {
      throw new UnauthorizedException(
        "Votre compte a été désactivé. Contactez l'administrateur.",
      );
    }

    // bcrypt.compare compare le mot de passe brut avec le hash stocké en base
    const passwordValid = await this.comparePassword(
      dto.password,
      user.password,
    );

    if (!passwordValid) {
      throw new UnauthorizedException('Identifiants invalides.');
    }

    const tokens = await this.generateTokens(user);

    // Rotation du refresh token à chaque connexion : invalide l'ancien token
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
    // Réponse identique que l'email existe ou non — évite l'énumération d'emails
    const genericResponse = {
      message:
        'Si un compte existe avec cet email, un lien de réinitialisation a été envoyé.',
    };
    const user = await this.userRepository.findOne({
      where: { email: dto.email },
    });

    // Retourne la même réponse même si l'utilisateur n'existe pas (anti-énumération)
    if (!user) {
      return genericResponse;
    }

    // Token aléatoire cryptographiquement sûr (64 caractères hex)
    const token = randomBytes(32).toString('hex');
    const expires = new Date();
    expires.setHours(expires.getHours() + 1); // Lien valable 1h seulement

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

    // En dev sans SMTP configuré : retourne l'URL directement pour les tests
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

    // Cherche l'utilisateur par son token de réinitialisation
    const user = await this.userRepository.findOne({
      where: {
        resetPasswordToken: dto.token,
      },
    });

    // Rejette si token invalide, absent, ou expiré (après 1h)
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
    // Efface le token pour qu'il ne puisse pas être réutilisé
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    await this.userRepository.save(user);

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

    // Valide uniquement si le token existe ET n'est pas expiré
    return {
      valid:
        !!user &&
        !!user.resetPasswordExpires &&
        user.resetPasswordExpires >= new Date(),
    };
  }

  /**
   * Génère un access token (15min) et un refresh token (7j) signés avec leurs secrets respectifs.
   * Le payload contient : sub (userId), email, role — suffisant pour identifier l'utilisateur sur chaque requête.
   */
  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,   // "sub" = subject = identifiant standard JWT
      email: user.email,
      role: user.role,
    };

    const accessToken = await this.jwtService.signAsync(payload, {
      secret: this.accessTokenSecret,
      expiresIn: this.accessTokenExpiresIn, // 15 minutes
    });

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.refreshTokenSecret, // Secret différent du access token
      expiresIn: this.refreshTokenExpiresIn, // 7 jours
    });

    return {
      accessToken,
      refreshToken,
    };
  }

  /**
   * Hash générique avec bcrypt (10 rounds).
   * Utilisé pour hasher les refresh tokens stockés en base (en plus des mots de passe).
   */
  private async hashData(data: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(data, saltRounds);
  }

  /**
   * Renouvelle les tokens à partir d'un refresh token valide.
   * Double vérification : signature JWT + comparaison avec le hash stocké en base (anti-replay).
   */
  async refreshTokens(dto: RefreshTokenDto) {
    try {
      // 1. Vérifie la signature et l'expiration du refresh token
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

      // 2. Vérifie que le token correspond bien au hash stocké en base
      // → Empêche la réutilisation d'un ancien token si le compte a été déconnecté manuellement
      const refreshTokenMatches = await bcrypt.compare(
        dto.refreshToken,
        user.refreshTokenHash,
      );

      if (!refreshTokenMatches) {
        throw new UnauthorizedException('Refresh token invalide.');
      }

      const tokens = await this.generateTokens(user);

      // 3. Rotation : remplace le hash du refresh token pour invalider l'ancien
      const newRefreshTokenHash = await this.hashData(tokens.refreshToken);
      user.refreshTokenHash = newRefreshTokenHash;
      await this.userRepository.save(user);

      return {
        message: 'Tokens régénérés avec succès.',
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      };
    } catch (_error) {
      // Englobe toutes les erreurs JWT (expiration, signature invalide, etc.)
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

  /** Hash un mot de passe avec bcrypt — 10 rounds de salage (bon compromis sécurité/performance) */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /** Compare un mot de passe en clair avec son hash bcrypt stocké en base */
  private async comparePassword(
    password: string,
    hash: string,
  ): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /** @deprecated Remplacée par generateTokens() — conservée pour compatibilité éventuelle */
  private async signToken(user: User): Promise<string> {
    const payload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload);
  }

  /**
   * Retourne uniquement les champs publics de l'utilisateur.
   * Exclut intentionnellement : password, refreshTokenHash, resetPasswordToken, etc.
   */
  private sanitizeUser(user: User): AuthUser {
    return {
      userId: user.id,
      email: user.email,
      role: user.role,
    };
  }

  /**
   * Construit l'URL de réinitialisation de mot de passe pointant vers le frontend.
   * Le token est encodé en URL pour éviter les problèmes avec les caractères spéciaux.
   */
  private buildPasswordResetUrl(token: string): string {
    return `${this.appBaseUrl}/auth/reset-password?token=${encodeURIComponent(token)}`;
  }
}
