# Authentification & Routing Frontend

> Guards · Services Auth · Composants d'authentification

## AuthService — `frontend/src/app/core/services/auth.service.ts`

Service singleton (`providedIn: 'root'`) qui gère toute l'authentification côté client.

### État géré

```typescript
// Observable de l'utilisateur connecté (null si non connecté)
public currentUser$: Observable<User | null>

// Exemple d'abonnement dans un composant
const user = toSignal(authService.currentUser$); // Signal dérivé
```

### Méthodes

#### `signin(email, password): Observable<AuthResponse>`

```typescript
// Appelle POST /api/auth/signin
// Stocke automatiquement les tokens via tap(response => storeSession(response))
signin(email: string, password: string): Observable<AuthResponse>

// Réponse :
interface AuthResponse {
  user: { userId: string; email: string; role: string };
  accessToken: string;
  refreshToken: string;
}
```

#### `signup(data): Observable<AuthResponse>`

```typescript
// Normalise les champs (firstName → firstname) puis appelle POST /api/auth/signup
// Stocke automatiquement les tokens
signup(data: {
  email: string;
  password: string;
  firstName?: string; firstname?: string;
  lastName?: string; lastname?: string;
  phone?: string;
}): Observable<AuthResponse>
```

#### `logout(): void`

```typescript
// Supprime les tokens du localStorage
// Émet null dans currentUser$
logout(): void
```

#### `ensureValidAccessToken(): Observable<string | null>`

Utilisé par l'intercepteur HTTP et les guards.

```typescript
// Si access token valide → retourne le token immédiatement
// Si access token expiré mais refresh token valide → refresh silencieux
// Si aucun token valide → logout() + retourne null
// Si un refresh est déjà en cours → partage le même Observable (shareReplay)
ensureValidAccessToken(): Observable<string | null>
```

#### `getCurrentUser(): User | null`

```typescript
// Retourne l'utilisateur depuis le BehaviorSubject
// Retourne null si la session est expirée
getCurrentUser(): User | null
```

#### `isAuthenticated(): boolean`

```typescript
// true si au moins un token valide existe (access OU refresh)
// Nettoie currentUser$ si les deux sont expirés
isAuthenticated(): boolean
```

#### `hasValidAccessToken(): boolean`

```typescript
// true si l'access token existe et n'est pas expiré
hasValidAccessToken(): boolean
```

#### `hasValidRefreshToken(): boolean`

```typescript
// true si le refresh token existe et n'est pas expiré
hasValidRefreshToken(): boolean
```

#### `getAccessToken(): string | null`

```typescript
// Retourne l'access token si valide, null sinon
getAccessToken(): string | null
```

#### `refreshTokens(): Observable<AuthResponse>`

```typescript
// Appelle POST /api/auth/refresh avec le refreshToken du localStorage
// Stocke les nouveaux tokens automatiquement
refreshTokens(): Observable<AuthResponse>
```

#### `requestPasswordReset(email): Observable<PasswordResetRequestResponse>`

```typescript
// POST /api/auth/forgot-password
// En dev : la réponse contient l'URL de reset (devResetUrl)
requestPasswordReset(email: string): Observable<{
  message: string;
  devResetUrl?: string; // Pratique en dev pour tester sans email
}>
```

#### `validateResetPasswordToken(token): Observable<{ valid: boolean }>`

```typescript
// GET /api/auth/reset-password/validate?token=...
validateResetPasswordToken(token: string): Observable<{ valid: boolean }>
```

#### `resetPassword(token, newPassword): Observable<{ message: string }>`

```typescript
// POST /api/auth/reset-password
resetPassword(token: string, newPassword: string): Observable<{ message: string }>
```

### Méthodes privées

#### `storeSession(response)`

Après signin/signup/refresh :
1. Stocke `accessToken` dans `localStorage`
2. Stocke `refreshToken` dans `localStorage` (si présent)
3. Décode le token et met à jour `currentUserSubject`

#### `loadUser()`

Au démarrage de l'app :
1. Lit `accessToken` et `refreshToken` du `localStorage`
2. Si le token est expiré → nettoyage du localStorage → retourne null
3. Si valide → décode et retourne `{ userId, email, role }`

#### `decodeToken(token): JwtPayload | null`

Décode le payload Base64 d'un JWT sans vérifier la signature (décodage côté client uniquement).

#### `isTokenExpired(token, skewSeconds = 30): boolean`

```typescript
// Vérifie si le token expire dans moins de 30 secondes
// skewSeconds = marge pour compenser les délais réseau
private isTokenExpired(token: string, skewSeconds = 30): boolean {
  const payload = this.decodeToken(token);
  const nowInSeconds = Math.floor(Date.now() / 1000);
  return payload.exp <= nowInSeconds + skewSeconds;
}
```

#### `normalizeRole(role): string`

```typescript
// Convertit le rôle en minuscules (ex: 'ADMIN' → 'admin')
private normalizeRole(role: unknown): string {
  if (typeof role !== 'string') return 'client';
  return role.toLowerCase().trim();
}
```

---

## Guards

### `AuthGuard` — `frontend/src/app/core/guards/auth.guard.ts`

Protège les routes qui nécessitent une authentification.

```typescript
canActivate(route, state): Observable<boolean | UrlTree> {
  return this.authService.ensureValidAccessToken().pipe(
    map((token) => {
      if (token) return true; // ✅ Token valide → accès autorisé

      // ❌ Pas de token → redirection vers signin avec returnUrl
      return this.router.createUrlTree(['/auth/signin'], {
        queryParams: { returnUrl: state.url }
      });
    })
  );
}
```

**Utilisé sur** : `/payments`, `/profile`, `/shop/cart`

### `AdminGuard` — `frontend/src/app/features/admin/guards/admin.guard.ts`

```typescript
canActivate(): boolean {
  const user = this.authService.getCurrentUser();
  if (user && (user.role === 'admin' || user.role === 'super_admin')) {
    return true;
  }
  this.router.navigate(['/']); // Redirection vers accueil
  return false;
}
```

### `SuperAdminGuard` — `frontend/src/app/features/super-admin/guards/super-admin.guard.ts`

```typescript
canActivate(): boolean {
  const user = this.authService.getCurrentUser();
  if (user && user.role === 'super_admin') return true;
  this.router.navigate(['/']);
  return false;
}
```

### `ClientGuard` — `frontend/src/app/features/client/guards/client.guard.ts`

Vérifie que l'utilisateur est connecté avec le rôle `client`.

### `EmployeeGuard` — `frontend/src/app/features/employee/guards/employee.guard.ts`

Vérifie que l'utilisateur est connecté avec le rôle `employee`.

---

## Composants d'authentification

### `SigninComponent` — `/auth/signin`

**Fichier** : `frontend/src/app/features/auth/signin/signin.component.ts`

```typescript
// Formulaire réactif
form: FormGroup = fb.group({
  email:    ['', [Validators.required, Validators.email]],
  password: ['', [Validators.required, Validators.minLength(6)]]
});

loading = false;
error: string | null = null;
hidePassword = true;
```

#### `onSubmit()`

```
1. Vérifie que le formulaire est valide
2. loading = true, error = null
3. Appelle authService.signin(email, password)
4. En cas de succès :
   a. Récupère le rôle de la réponse
   b. Calcule le chemin de redirection :
      - super_admin → /super-admin/dashboard
      - admin       → /admin/dashboard
      - employee    → /employee/dashboard
      - client      → /client/dashboard
   c. Vérifie s'il y a un returnUrl dans les queryParams
   d. Navigue vers le bon chemin
   e. loading = false (dans le finally)
5. En cas d'erreur :
   - status 401 → "Identifiants invalides"
   - status 0   → "API indisponible. Vérifie que le backend tourne sur le port 3000"
   - Autre      → message du backend
   - loading = false
```

### `SignupComponent` — `/auth/signup`

**Fichier** : `frontend/src/app/features/auth/signup/signup.component.ts`

Formulaire d'inscription avec :
- Prénom, nom
- Email
- Téléphone
- Mot de passe + confirmation

Après inscription réussie → redirige vers `/client/dashboard`.

### `ForgotPasswordComponent` — `/auth/forgot-password`

Saisie de l'email → POST `/api/auth/forgot-password` → affichage du message de confirmation.

En dev, le lien de reset est affiché directement dans l'interface.

### `ResetPasswordComponent` — `/auth/reset-password`

1. Au chargement : lit le `?token=` dans l'URL et valide avec l'API
2. Si token valide → affiche le formulaire de nouveau mot de passe
3. Si token invalide/expiré → affiche un message d'erreur

---

## Flux de redirection après connexion

```
Utilisateur visite /shop/cart (protégé)
    ↓
AuthGuard → pas de token → redirection
    ↓
/auth/signin?returnUrl=%2Fshop%2Fcart
    ↓
Utilisateur se connecte avec succès
    ↓
SigninComponent lit le returnUrl
    ↓
router.navigateByUrl('/shop/cart')
    ↓
Utilisateur est sur la page panier ✅
```

---

## Stockage des tokens

| Clé localStorage | Contenu | Durée |
|-----------------|---------|-------|
| `accessToken` | JWT encodé, payload: `{ sub, email, role, exp }` | 1 heure |
| `refreshToken` | JWT encodé, payload: `{ sub, email, role, exp }` | 30 jours |

> **Sécurité** : Les tokens sont stockés en `localStorage` (accessible en JS). Pour une sécurité maximale, les cookies `httpOnly` seraient préférables, mais nécessitent une configuration backend différente.
