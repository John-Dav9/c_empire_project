# Architecture Frontend — C'EMPIRE

> Angular 20+ · Signals · Standalone · Material Design

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des dossiers](#structure-des-dossiers)
3. [Configuration de l'application](#configuration-de-lapplication)
4. [Routing principal](#routing-principal)
5. [Intercepteur HTTP (Auth)](#intercepteur-http-auth)
6. [Config API dynamique](#config-api-dynamique)
7. [Conventions Angular 20+](#conventions-angular-20)
8. [Responsive Design](#responsive-design)

---

## Vue d'ensemble

Le frontend est une SPA (Single Page Application) Angular en mode **standalone components** (Angular 20+). Il n'y a pas de `NgModule` — chaque composant importe directement ses dépendances.

### Caractéristiques principales

| Fonctionnalité | Implémentation |
|----------------|---------------|
| State management | **Signals** (`signal()`, `computed()`) |
| Routing | Lazy loading par feature |
| Auth | Intercepteur JWT + refresh automatique |
| UI | Angular Material + CSS custom |
| Formulaires | Reactive Forms (`FormBuilder`) |
| HTTP | `HttpClient` avec intercepteur |
| Control flow | `@if`, `@for`, `@switch` (natif Angular 17+) |

---

## Structure des dossiers

```
frontend/src/app/
│
├── app.ts                     # Composant racine (AppComponent)
├── app.routes.ts              # Routes principales
├── app.config.ts              # Configuration Angular (providers, intercepteurs)
│
├── core/                      # Infrastructure singleton
│   ├── config/
│   │   └── api.config.ts      # URL API dynamique
│   ├── guards/
│   │   └── auth.guard.ts      # Redirige si non connecté
│   └── services/
│       ├── auth.service.ts    # Authentification
│       ├── api.service.ts     # Client HTTP générique
│       ├── payment.service.ts # Paiements
│       ├── shop-cart.service.ts # Panier
│       ├── content-pages.service.ts # Pages CMS
│       └── footer-config.service.ts # Footer
│
├── shared/                    # Composants réutilisables
│   ├── layout/
│   │   └── layout.component.ts      # Shell principal (header + footer)
│   ├── footer/
│   │   └── site-footer.component.ts # Pied de page
│   ├── not-found/
│   │   └── not-found.component.ts   # Page 404
│   ├── ui/
│   │   ├── status-badge/      # Badge de statut coloré
│   │   ├── page-header/       # En-tête de page
│   │   └── stat-card/         # Carte statistique
│   └── pipes/
│       ├── currency-xaf.pipe.ts  # Formatage XAF
│       └── status-label.pipe.ts  # Labels de statut
│
└── features/                  # Pages de l'application
    ├── auth/                  # Connexion / Inscription
    ├── home/                  # Page d'accueil
    ├── shop/                  # C'Shop
    ├── grill/                 # C'Grill
    ├── express/               # C'Express
    ├── clean/                 # C'Clean
    ├── events/                # C'Events
    ├── todo/                  # C'Todo
    ├── payments/              # Paiements
    ├── profile/               # Profil utilisateur
    ├── content/               # Pages CMS
    ├── admin/                 # Espace admin
    ├── client/                # Espace client
    ├── employee/              # Espace employé
    └── super-admin/           # Espace super administrateur
```

---

## Configuration de l'application

**Fichier** : `frontend/src/app/app.config.ts`

```typescript
export const appConfig: ApplicationConfig = {
  providers: [
    // Routing avec préchargement de tous les modules lazy
    provideRouter(routes, withPreloading(PreloadAllModules)),

    // Animations Angular Material (async = non-bloquant)
    provideAnimationsAsync(),

    // HttpClient avec l'intercepteur d'authentification
    provideHttpClient(
      withInterceptors([authInterceptorFn])
    ),
  ]
};
```

### Intercepteur d'authentification

L'intercepteur ajoute automatiquement le token JWT à chaque requête.

```typescript
const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  // 1. Routes publiques → bypass total (signin, signup, refresh, etc.)
  if (isPublicAuthEndpoint(req.url)) {
    return next(req);
  }

  const authService = inject(AuthService);

  // 2. S'assure d'avoir un access token valide (refresh si expiré)
  return authService.ensureValidAccessToken().pipe(
    switchMap((token) => {
      // 3. Clone la requête avec le header Authorization
      const authReq = token
        ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
        : req;

      return next(authReq).pipe(
        catchError((error: unknown) => {
          // 4. Si 401 et refresh token valide → tente un refresh puis rejoue
          const isUnauthorized = error instanceof HttpErrorResponse && error.status === 401;
          if (!isUnauthorized || !authService.hasValidRefreshToken()) {
            return throwError(() => error);
          }
          return authService.refreshTokens().pipe(
            switchMap((response) => {
              return next(req.clone({
                setHeaders: { Authorization: `Bearer ${response.accessToken}` }
              }));
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
```

**Routes publiques bypassées** (pas de token requis) :
```typescript
function isPublicAuthEndpoint(url: string): boolean {
  return (
    url.includes('/auth/signin') ||
    url.includes('/auth/signup') ||
    url.includes('/auth/refresh') ||
    url.includes('/auth/forgot-password') ||
    url.includes('/auth/reset-password')
  );
}
```

---

## Routing principal

**Fichier** : `frontend/src/app/app.routes.ts`

```typescript
export const routes: Routes = [
  // Routes d'authentification (sans layout)
  {
    path: 'auth',
    children: [
      { path: 'signin', component: SigninComponent },
      { path: 'signup', component: SignupComponent },
      { path: 'forgot-password', component: ForgotPasswordComponent },
      { path: 'reset-password', component: ResetPasswordComponent },
    ]
  },

  // Routes avec le layout principal (header + footer)
  {
    path: '',
    component: LayoutComponent,
    children: [
      { path: '', component: HomeComponent },
      { path: 'shop', ... },
      { path: 'payments', canActivate: [AuthGuard], ... },
      { path: 'grill', loadChildren: () => import('./features/grill/grill.routes') },
      { path: 'express', loadChildren: () => import('./features/express/express.routes') },
      { path: 'clean', loadChildren: () => import('./features/clean/clean.routes') },
      { path: 'events', loadChildren: () => import('./features/events/events.routes') },
      { path: 'todo', loadChildren: () => import('./features/todo/todo.routes') },
      { path: 'profile', canActivate: [AuthGuard], loadChildren: ... },
      { path: 'admin', loadChildren: () => import('./features/admin/admin.routes') },
      { path: 'client', loadChildren: () => import('./features/client/client.routes') },
      { path: 'employee', loadChildren: () => import('./features/employee/employee.routes') },
      { path: 'super-admin', loadChildren: () => import('./features/super-admin/super-admin.routes') },
      { path: '404', component: NotFoundComponent },
    ]
  },

  // Catch-all → 404
  { path: '**', component: NotFoundComponent }
];
```

### Lazy Loading

Les routes préfixées par `loadChildren` chargent leur code uniquement quand la route est visitée. Cela réduit le bundle initial.

```
Chargement initial : core + home + shop basique
Chargement à la demande :
  - /grill       → chunk grill
  - /express     → chunk express
  - /super-admin → chunk super-admin (lourd, rarement visité)
  etc.
```

---

## Config API dynamique

**Fichier** : `frontend/src/app/core/config/api.config.ts`

### Détection automatique de l'environnement

```typescript
function getDefaultApiBaseUrl(): string {
  const { hostname, port, protocol } = window.location;

  // Dev local (port 4200 ou 4201 = Angular dev server)
  if (port === '4200' || port === '4201') {
    return `${protocol}//${hostname}:3000/api`;
    // → http://localhost:3000/api
  }

  // Accès direct via localhost
  if (hostname === 'localhost') return 'http://localhost:3000/api';
  if (hostname === '127.0.0.1') return 'http://127.0.0.1:3000/api';

  // Production → URL relative (même domaine)
  return '/api';
}
```

### Override via `window.__CEMPIRE_CONFIG__`

Le fichier `public/config.js` peut surcharger l'URL :

```javascript
// Dev : apiBaseUrl vide → utilise la détection automatique
window.__CEMPIRE_CONFIG__ = { apiBaseUrl: '' };

// Production : URL explicite du backend Render
window.__CEMPIRE_CONFIG__ = { apiBaseUrl: 'https://c-empire.onrender.com/api' };
```

### Fonctions exportées

```typescript
// URL de base de l'API (ex: http://localhost:3000/api)
export const API_BASE_URL: string;

// Construit l'URL complète d'un endpoint
// buildApiUrl('/auth') → 'http://localhost:3000/api/auth'
export function buildApiUrl(path: string): string;

// Construit l'URL d'un média (image, upload)
// buildMediaUrl('/uploads/product.jpg') → 'http://localhost:3000/uploads/product.jpg'
export function buildMediaUrl(path?: string | null): string;
```

---

## Conventions Angular 20+

### 1. Pas de `standalone: true` dans le décorateur

En Angular 20+, les composants sont standalone par défaut. Ne pas écrire `standalone: true`.

```typescript
// ✅ Correct
@Component({ selector: 'app-mon-composant', ... })
export class MonComposant {}

// ❌ Inutile
@Component({ selector: 'app-mon-composant', standalone: true, ... })
export class MonComposant {}
```

### 2. Signals pour le state

```typescript
// État local
const loading = signal(false);
const items = signal<Product[]>([]);
const error = signal<string | null>(null);

// État dérivé (calculé automatiquement)
const itemCount = computed(() => items().length);
const hasItems = computed(() => items().length > 0);

// Modifier l'état
loading.set(true);
items.update(current => [...current, newItem]);
```

### 3. `inject()` à la place du constructeur

```typescript
// ✅ Moderne
export class MonComposant {
  private authService = inject(AuthService);
  private router = inject(Router);
}

// ❌ Ancien style (encore fonctionnel mais déprécié pour les composants)
export class MonComposant {
  constructor(private authService: AuthService) {}
}
```

### 4. Control flow natif

```html
<!-- ✅ Natif Angular 17+ -->
@if (loading()) {
  <mat-spinner />
} @else {
  @for (item of items(); track item.id) {
    <app-item [item]="item" />
  }
}

<!-- ❌ Ancien style -->
<mat-spinner *ngIf="loading"></mat-spinner>
<app-item *ngFor="let item of items" [item]="item"></app-item>
```

### 5. `ChangeDetectionStrategy.OnPush`

Tous les composants utilisent `OnPush` pour optimiser les performances.

```typescript
@Component({
  changeDetection: ChangeDetectionStrategy.OnPush,
  ...
})
```

### 6. Propriétés hôtes dans le décorateur

```typescript
// ✅ Dans host
@Component({
  host: { '(click)': 'onClick()', '[class.active]': 'isActive()' },
})

// ❌ Éviter @HostListener et @HostBinding
@HostListener('click') onClick() {}
@HostBinding('class.active') isActive = false;
```

---

## Responsive Design

L'ensemble du frontend est optimisé pour tous les appareils. L'approche est **desktop-first** avec des `@media (max-width: ...)` décroissants.

### Système de breakpoints

| Breakpoint | Contexte |
|-----------|----------|
| `1180px` | Footer : passe de 4 colonnes à 2 |
| `1024px` | Admin layout : réduction de la largeur de la sidebar |
| `980px` | Shop : sidebar panier passe sous les produits |
| `940px` | Navbar/toolbar principale |
| `920px` | Pages héros (home, grill checkout) |
| `860px` | Grille produits shop : `minmax(240px)` → `minmax(180px)` |
| `768px` | Admin layout mobile (voir ci-dessous), panier |
| `760px` | Pages métier (express, todo, grill, events) |
| `720px` | C'Clean |
| `640px` | Home page, grille produits (2 colonnes) |
| `600px` | Page de connexion |
| `480px` | Petits téléphones (< iPhone SE) — tous les modules |
| `400px` | Très petits écrans — grilles en 1 colonne |
| `390px` | Accueil : hero 1 colonne |

### Typographie fluide

Les titres utilisent `clamp()` pour s'adapter sans media queries :

```css
font-size: clamp(1.55rem, 7vw, 2rem);   /* Hero mobile */
font-size: clamp(2rem, 4vw, 5rem);      /* Hero desktop */
font-size: clamp(1.4rem, 2.2vw, 1.9rem); /* H1 sections */
```

### Layout principal — `shared/layout/`

**Fichier** : `shared/layout/layout.component.ts`

La toolbar est `position: sticky; top: 14px` avec `margin: 14px`. Elle se contracte sur mobile :

```
≥ 940px  → padding 0 16px, height 70px
< 940px  → padding 0 14px, height 66px
< 480px  → padding 0 8px, height 60px, logo 24px
```

### Admin layout mobile — `super-admin/layout/`

Sur tablette/mobile (`< 768px`), la sidebar est cachée par défaut et s'ouvre via un bouton hamburger :

```
Desktop (≥ 768px) :
  [Sidebar 280px] [Contenu principal]

Mobile (< 768px) :
  [Header sticky 56px : ☰ C'EMPIRE Admin]
  [Contenu principal (pleine largeur)]
  ↳ ☰ → sidebar slides in (translateX) + overlay backdrop
```

**Composants** :
- `.mobile-header` — header sticky, masqué sur desktop
- `.mobile-overlay` — fond semi-transparent, ferme le menu au clic
- `.sidebar.mobile-open` — déclenché par `mobileMenuOpen` signal
- Chaque lien de nav appelle `closeMobileMenu()` au clic

### Grilles responsives — approche CSS Grid

```css
/* Adaptatif automatique (auto-fill) */
grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
/* → 3 colonnes sur desktop, 2 sur tablette, 1 sur mobile */

/* Contrôle manuel par breakpoint */
@media (max-width: 640px) {
  grid-template-columns: repeat(2, 1fr); /* Toujours 2 colonnes */
}
@media (max-width: 400px) {
  grid-template-columns: 1fr; /* 1 seule colonne */
}
```

### Résumé par composant

| Composant | Breakpoints CSS |
|-----------|----------------|
| `layout.component.ts` | 940px, 480px |
| `site-footer.component.scss` | 1180px, 760px, 400px |
| `admin-layout.component.ts` | 1024px, 768px |
| `home.component.ts` | 920px, 640px, 390px |
| `product-list.component.scss` | 980px, 860px, 640px, 400px |
| `cart.component.scss` | 768px, 480px |
| `grill-public.component.ts` | 760px, 480px |
| `grill-checkout.component.ts` | 920px, 680px |
| `events-public.component.ts` | 1120px, 760px, 480px |
| `clean-public.component.ts` | 1120px, 720px, 480px, 400px |
| `express-public.component.ts` | 1120px, 760px, 480px, 400px |
| `todo-public.component.ts` | 980px, 760px, 480px, 400px |
| `payment-success.component.ts` | 480px |
| `payment-cancel.component.ts` | 480px |
| `not-found.component.ts` | 480px |
| `signin.component.scss` | 600px |

---

*Voir aussi :*
- *[02-auth-routing.md](02-auth-routing.md) — Authentification et guards*
- *[03-services-core.md](03-services-core.md) — Services Angular*
- *[04-modules-metier.md](04-modules-metier.md) — Pages et composants*
