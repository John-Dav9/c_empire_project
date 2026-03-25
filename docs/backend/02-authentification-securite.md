# Authentification & Sécurité — C'EMPIRE

> Module `auth/` · JWT · Rôles · Guards · Décorateurs

## Table des matières

1. [Entités utilisateur](#entités-utilisateur)
2. [Service d'authentification](#service-dauthentification)
3. [Contrôleur auth](#contrôleur-auth)
4. [DTOs](#dtos)
5. [Guards](#guards)
6. [Stratégies Passport](#stratégies-passport)
7. [Décorateurs](#décorateurs)
8. [Flux complets](#flux-complets)

---

## Entités utilisateur

### `User` — `backend/src/auth/entities/user.entity.ts`

Table principale des comptes utilisateurs.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire (auto-générée) |
| `email` | string | Email unique, utilisé comme identifiant de connexion |
| `password` | string | Hash bcrypt du mot de passe |
| `role` | enum | `client` · `admin` · `employee` · `super_admin` |
| `specialty` | enum (nullable) | Sous-rôle employé : `livreur`, `nettoyeur`, `coursier`, etc. |
| `isActive` | boolean | Compte actif ou désactivé (défaut: `true`) |
| `createdAt` | Date | Date de création |
| `updatedAt` | Date | Date de dernière modification |

**Enum `UserRole`** (`auth/enums/user-role.enum.ts`) :
```typescript
export enum UserRole {
  CLIENT      = 'client',
  EMPLOYEE    = 'employee',
  ADMIN       = 'admin',
  SUPER_ADMIN = 'super_admin',
}
```

**Enum `EmployeeSpecialty`** (`auth/enums/employee-specialty.enum.ts`) :
```typescript
export enum EmployeeSpecialty {
  LIVREUR          = 'livreur',          // Livraisons C'Express
  EVENEMENTIALISTE = 'evenementialiste', // Organisation d'événements
  COURSIER         = 'coursier',         // Courses/livraisons rapides
  NETTOYEUR        = 'nettoyeur',        // Services nettoyage C'Clean
  BRICOLEUR        = 'bricoleur',        // Services à la demande C'Todo
  POINT_RELAIS     = 'point_relais',     // Gestion d'un point relais
}
```

### `Profile` — `backend/src/auth/entities/profile.entity.ts`

Table du profil utilisateur (relation 1:1 avec `User`).

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Référence vers `users.id` |
| `firstname` | string | Prénom |
| `lastname` | string | Nom de famille |
| `phone` | string (nullable) | Numéro de téléphone |
| `avatar` | string (nullable) | URL de la photo de profil |
| `address` | string (nullable) | Adresse postale |
| `city` | string (nullable) | Ville |
| `bio` | string (nullable) | Biographie courte |

---

## Service d'authentification

**Fichier** : `backend/src/auth/auth.service.ts`

### `signup(dto: SignupDto): Promise<AuthResponse>`

Crée un nouveau compte utilisateur.

```
1. Vérifie si l'email existe déjà → ConflictException si oui
2. Hash le mot de passe avec bcrypt (10 rounds)
3. Crée l'entité User en base de données
4. Crée le Profile associé (firstname, lastname, phone)
5. Génère accessToken + refreshToken JWT
6. Retourne { user, accessToken, refreshToken }
```

### `signin(dto: SigninDto): Promise<AuthResponse>`

Authentifie un utilisateur existant.

```
1. Recherche l'utilisateur par email → NotFoundException si absent
2. Compare le mot de passe envoyé avec le hash bcrypt → UnauthorizedException si incorrect
3. Vérifie que le compte est actif (isActive) → UnauthorizedException si désactivé
4. Génère accessToken + refreshToken JWT
5. Retourne { user, accessToken, refreshToken }
```

### `refreshTokens(dto: RefreshTokenDto): Promise<AuthResponse>`

Renouvelle les tokens à partir d'un refresh token valide.

```
1. Vérifie et décode le refreshToken avec JWT_REFRESH_SECRET
2. Charge l'utilisateur depuis la BDD (pour avoir les données fraîches)
3. Génère de nouveaux tokens
4. Retourne { accessToken, refreshToken }
```

### `requestPasswordReset(dto: ForgotPasswordDto): Promise<PasswordResetResponse>`

Envoie un email de réinitialisation de mot de passe.

```
1. Recherche l'utilisateur par email (pas d'erreur si absent → sécurité)
2. Génère un token de reset (JWT court durée)
3. Construit l'URL de reset : APP_BASE_URL/auth/reset-password?token=...
4. Envoie l'email via NotificationsService
5. En dev : inclut l'URL dans la réponse JSON (pratique pour tester)
6. Retourne { message: "Email envoyé si le compte existe" }
```

### `resetPassword(dto: ResetPasswordDto): Promise<void>`

Réinitialise le mot de passe avec un token valide.

```
1. Vérifie et décode le token de reset
2. Charge l'utilisateur
3. Hash le nouveau mot de passe
4. Sauvegarde en base de données
```

### `validateResetPasswordToken(token: string): Promise<{ valid: boolean }>`

Vérifie si un token de reset est encore valide (utilisé par le frontend pour afficher le formulaire ou une erreur).

### Méthodes privées

#### `hashPassword(password: string): Promise<string>`
```typescript
// bcrypt avec 10 rounds de salt
return bcrypt.hash(password, 10);
```

#### `comparePassword(plain: string, hash: string): Promise<boolean>`
```typescript
return bcrypt.compare(plain, hash);
```

#### `generateTokens(user: User): { accessToken: string, refreshToken: string }`
```typescript
// Payload inclus dans les tokens JWT
const payload = { sub: user.id, email: user.email, role: user.role };

const accessToken  = jwt.sign(payload, process.env.JWT_ACCESS_SECRET, { expiresIn: '1h' });
const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET, { expiresIn: '30d' });
```

#### `buildPasswordResetUrl(token: string): string`
```typescript
return `${process.env.APP_BASE_URL}/auth/reset-password?token=${token}`;
```

---

## Contrôleur auth

**Fichier** : `backend/src/auth/auth.controller.ts`
**Préfixe** : `/api/auth`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `POST` | `/signup` | 🌍 Public | Créer un compte |
| `POST` | `/signin` | 🌍 Public | Se connecter |
| `GET` | `/me` | 🔐 JWT requis | Infos de l'utilisateur connecté |
| `POST` | `/refresh` | 🌍 Public | Renouveler les tokens |
| `POST` | `/forgot-password` | 🌍 Public | Demander un reset de mot de passe |
| `GET` | `/reset-password/validate` | 🌍 Public | Vérifier la validité d'un token reset |
| `POST` | `/reset-password` | 🌍 Public | Réinitialiser le mot de passe |
| `GET` | `/admin-only` | 👑 Admin/SuperAdmin | Route de test admin |

---

## DTOs

### `SignupDto` — `backend/src/dto/signup.dto.ts`

```typescript
class SignupDto {
  @IsEmail()
  email: string;           // "user@example.com"

  @IsString()
  @MinLength(8)
  password: string;        // "ChangeMe123!"

  @IsString()
  @IsNotEmpty()
  firstname: string;       // "Jean"

  @IsString()
  @IsNotEmpty()
  lastname: string;        // "Dupont"

  @IsOptional()
  @IsString()
  phone?: string;          // "+237600000000"
}
```

### `SigninDto` — `backend/src/dto/signin.dto.ts`

```typescript
class SigninDto {
  @IsEmail()
  email: string;

  @IsString()
  @IsNotEmpty()
  password: string;
}
```

### `RefreshTokenDto` — `backend/src/dto/refresh-token.dto.ts`

```typescript
class RefreshTokenDto {
  @IsString()
  @IsNotEmpty()
  refreshToken: string;
}
```

### `ForgotPasswordDto` — `backend/src/dto/forgot-password.dto.ts`

```typescript
class ForgotPasswordDto {
  @IsEmail()
  email: string;
}
```

### `ResetPasswordDto` — `backend/src/dto/reset-password.dto.ts`

```typescript
class ResetPasswordDto {
  @IsString()
  @IsNotEmpty()
  token: string;

  @IsString()
  @MinLength(8)
  newPassword: string;
}
```

---

## Guards

### `JwtAuthGuard` — `backend/src/guards/jwt-auth.guard.ts`

Guard global appliqué à **toutes** les routes. C'est le premier garde de sécurité.

```typescript
canActivate(context: ExecutionContext) {
  const request = context.switchToHttp().getRequest();

  // 1. Preflight CORS : laisse passer sans vérification JWT
  if (request.method === 'OPTIONS') return true;

  // 2. Route marquée @Public() : laisse passer sans JWT
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    context.getHandler(),   // Vérifie d'abord le décorateur sur la méthode
    context.getClass(),     // Puis sur la classe (le controller entier)
  ]);
  if (isPublic) return true;

  // 3. Toutes les autres routes : vérifie le JWT
  return super.canActivate(context); // Passport JWT strategy
}
```

**`handleRequest`** : Si le JWT est invalide ou absent → `UnauthorizedException (401)`.

### `RolesGuard` — `backend/src/core/roles/roles.guard.ts`

Vérifie que l'utilisateur connecté a le rôle requis.

```typescript
canActivate(context: ExecutionContext): boolean {
  // Lit les rôles requis depuis @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [...]);

  // Si aucun rôle requis, laisse passer
  if (!requiredRoles || requiredRoles.length === 0) return true;

  // Vérifie que le rôle de l'utilisateur est dans la liste
  const { user } = context.switchToHttp().getRequest();
  return requiredRoles.includes(user?.role);
  // Si non → ForbiddenException (403)
}
```

### `PermissionsGuard` — `backend/src/core/permissions/permissions.guard.ts`

Contrôle plus fin que RolesGuard, vérifie des permissions spécifiques.

---

## Stratégies Passport

### `JwtStrategy` — `backend/src/strategies/jwt.strategy.ts`

Définit comment extraire et valider le JWT :

```typescript
@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  constructor() {
    super({
      // Extrait le token du header Authorization: Bearer <token>
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET,
      ignoreExpiration: false, // Rejette les tokens expirés
    });
  }

  // Appelé après validation du token
  // Le payload est injecté dans req.user
  validate(payload: JwtPayload): AuthUser {
    return {
      userId: payload.sub,
      email: payload.email,
      role: payload.role,
    };
  }
}
```

### Interfaces

**`AuthUser`** (`interfaces/auth-user.interface.ts`) :
```typescript
export interface AuthUser {
  userId: string;  // UUID de l'utilisateur
  email: string;
  role: string;    // 'client' | 'admin' | 'employee' | 'super_admin'
}
```

**`JwtPayload`** (`interfaces/jwt-payload.interface.ts`) :
```typescript
export interface JwtPayload {
  sub: string;    // userId (subject JWT standard)
  email: string;
  role: string;
  iat?: number;   // Issued At (généré automatiquement)
  exp?: number;   // Expiration (généré automatiquement)
}
```

**`AuthenticatedRequest`** (`interfaces/authenticated-request.interface.ts`) :
```typescript
// Extension du Request Express avec l'utilisateur injecté
export interface AuthenticatedRequest extends Request {
  user: AuthUser;
  rawBody?: Buffer; // Corps brut pour les webhooks
}
```

---

## Décorateurs

### `@Public()` — `backend/src/auth/decorators/public.decorator.ts`

Marque une route ou un controller entier comme public (pas de JWT requis).

```typescript
export const IS_PUBLIC_KEY = 'isPublic';
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

// Utilisation
@Public()
@Post('signin')
signin(@Body() dto: SigninDto) { ... }
```

### `@Roles(...)` — `backend/src/core/roles/roles.decorator.ts`

Restreint l'accès à certains rôles.

```typescript
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// Utilisation
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@Get('users')
getUsers() { ... }
```

### `@CurrentUser()` — `backend/src/auth/decorators/current-user.decorator.ts`

Injecte l'utilisateur connecté directement dans le paramètre de la méthode.

```typescript
export const CurrentUser = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<AuthenticatedRequest>();
    return request.user; // { userId, email, role }
  }
);

// Utilisation
@Get('me')
me(@CurrentUser() user: AuthUser) {
  return user; // { userId: '...', email: '...', role: 'client' }
}
```

---

## Flux complets

### Inscription (Signup)

```
Frontend                    Backend (NestJS)              Base de données
   │                              │                              │
   ├── POST /api/auth/signup ────►│                              │
   │   { email, password,         │                              │
   │     firstname, lastname }    │                              │
   │                              ├── Vérifie email unique ─────►│
   │                              │◄──── Non existant ───────────┤
   │                              │                              │
   │                              ├── bcrypt.hash(password) ─────┤
   │                              │                              │
   │                              ├── INSERT users ─────────────►│
   │                              ├── INSERT profiles ───────────►│
   │                              │◄──── OK ─────────────────────┤
   │                              │                              │
   │                              ├── jwt.sign(payload) ──────────┤
   │                              │                              │
   │◄── { user, accessToken, ─────┤
   │      refreshToken }          │
```

### Connexion (Signin)

```
Frontend                    Backend                       Base de données
   │                              │                              │
   ├── POST /api/auth/signin ────►│                              │
   │   { email, password }        │                              │
   │                              ├── SELECT user by email ─────►│
   │                              │◄──── User trouvé ────────────┤
   │                              │                              │
   │                              ├── bcrypt.compare() ──────────┤
   │                              │   (password vs hash)         │
   │                              │                              │
   │                              ├── jwt.sign(accessToken)      │
   │                              ├── jwt.sign(refreshToken)     │
   │                              │                              │
   │◄── { user, accessToken, ─────┤
   │      refreshToken }          │
   │                              │
   ├── localStorage.setItem('accessToken', ...)
   ├── localStorage.setItem('refreshToken', ...)
```

### Requête authentifiée (avec JWT)

```
Frontend                    Intercepteur Angular           Backend
   │                              │                          │
   ├── GET /api/profile ─────────►│                          │
   │                              ├── Lit accessToken ────────┤
   │                              │   dans localStorage       │
   │                              │                          │
   │                              │   Si expiré → POST /refresh
   │                              │                          │
   │                              ├── Ajoute header: ─────────►│
   │                              │   Authorization: Bearer   │
   │                              │                          │
   │                              │              [JwtAuthGuard]
   │                              │              Vérifie token
   │                              │              Injecte req.user
   │                              │                          │
   │◄── { profile data } ─────────┼──────────────────────────┤
```

### Refresh du token

```
Frontend                    Backend
   │                              │
   ├── POST /api/auth/refresh ────►│  @Public() → pas de JWT requis
   │   { refreshToken: "..." }     │
   │                              │
   │                              ├── jwt.verify(refreshToken, JWT_REFRESH_SECRET)
   │                              ├── Charge user depuis BDD
   │                              ├── Génère nouveaux tokens
   │                              │
   │◄── { accessToken, refreshToken }
```

---

## Erreurs courantes

| Erreur | Code | Cause |
|--------|------|-------|
| `UnauthorizedException` | 401 | Token absent, invalide ou expiré |
| `ForbiddenException` | 403 | Rôle insuffisant |
| `ConflictException` | 409 | Email déjà utilisé à l'inscription |
| `NotFoundException` | 404 | Utilisateur non trouvé |
| `BadRequestException` | 400 | DTO invalide (champ manquant, format incorrect) |

---

*Voir aussi :*
- *[01-architecture-backend.md](01-architecture-backend.md) pour le cycle de vie des requêtes*
- *[11-admin-super-admin.md](11-admin-super-admin.md) pour la gestion des utilisateurs côté admin*
