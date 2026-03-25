# Architecture Backend — C'EMPIRE

> NestJS · TypeORM · PostgreSQL · JWT

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Structure des dossiers](#structure-des-dossiers)
3. [Point d'entrée — main.ts](#point-dentrée--maints)
4. [Module racine — AppModule](#module-racine--appmodule)
5. [Cycle de vie d'une requête](#cycle-de-vie-dune-requête)
6. [Modules fonctionnels](#modules-fonctionnels)
7. [Infrastructure transversale (core/)](#infrastructure-transversale-core)
8. [Base de données](#base-de-données)
9. [Sécurité globale](#sécurité-globale)

---

## Vue d'ensemble

Le backend suit le pattern **MVC modulaire** de NestJS, organisé en modules indépendants par domaine métier. Chaque module expose ses propres contrôleurs (routes HTTP), services (logique métier) et entités (tables en base de données).

```
Requête HTTP
    │
    ▼
[CORS Middleware]          ← Autorise les origines frontend
    │
    ▼
[express.json()]           ← Parse le corps JSON + stocke rawBody pour webhooks
    │
    ▼
[JwtAuthGuard]             ← Vérifie le token JWT (global, sauf @Public())
    │
    ▼
[RolesGuard]               ← Vérifie le rôle requis (@Roles(...))
    │
    ▼
[PermissionsGuard]         ← Vérifie les permissions fines (@Permissions(...))
    │
    ▼
[AuditInterceptor]         ← Journalise la requête et la réponse
    │
    ▼
[ValidationPipe]           ← Valide et transforme le DTO entrant
    │
    ▼
[Route Handler]            ← Méthode du contrôleur
    │
    ▼
[GlobalExceptionFilter]    ← Formate toutes les erreurs en JSON standard
```

---

## Structure des dossiers

```
backend/src/
├── main.ts                    # Bootstrap de l'application
├── app.module.ts              # Module racine
├── app.controller.ts          # Route GET /
├── app.service.ts             # Service de base

├── auth/                      # Authentification
│   ├── auth.module.ts
│   ├── auth.controller.ts
│   ├── auth.service.ts
│   ├── entities/
│   │   ├── user.entity.ts
│   │   └── profile.entity.ts
│   ├── decorators/
│   │   ├── public.decorator.ts       # @Public()
│   │   ├── roles.decorator.ts        # @Roles()
│   │   └── current-user.decorator.ts # @CurrentUser()
│   ├── enums/
│   │   ├── user-role.enum.ts
│   │   └── employee-specialty.enum.ts
│   └── dto/ (dans src/dto/)

├── users/                     # Gestion des utilisateurs
├── admin/                     # Administration
├── tasks/                     # Missions employés

├── shop/                      # C'Shop (e-commerce)
│   ├── shop.module.ts
│   ├── product/
│   ├── cart/
│   ├── order/
│   ├── review/
│   ├── promotion/
│   └── relay-point/

├── grill/                     # C'Grill (restauration)
├── express/                   # C'Express (livraison)
├── clean/                     # C'Clean (nettoyage)
├── events/                    # C'Events (événements)
├── todo/                      # C'Todo (services)

├── core/                      # Infrastructure transversale
│   ├── audit/                 # Logging des requêtes
│   ├── filters/               # Gestion des erreurs
│   ├── highlights/            # Campagnes & actualités
│   ├── invoices/              # Génération de factures
│   ├── notifications/         # Email / SMS / WhatsApp
│   ├── payments/              # Système de paiement multi-provider
│   ├── permissions/           # Permissions fines
│   ├── roles/                 # Gestion des rôles
│   ├── sectors/               # Secteurs d'activité
│   └── site-settings/         # Configuration du site

├── guards/
│   └── jwt-auth.guard.ts      # Guard JWT global

├── strategies/
│   ├── jwt.strategy.ts        # Stratégie extraction JWT
│   └── refresh.strategy.ts    # Stratégie refresh token

├── interfaces/
│   ├── auth-user.interface.ts
│   ├── authenticated-request.interface.ts
│   ├── auth-response.interface.ts
│   └── jwt-payload.interface.ts

├── dto/                       # DTOs globaux (signup, signin, etc.)

├── database/
│   ├── data-source.ts         # Config TypeORM pour CLI migrations
│   └── bootstrap-schema.ts    # Initialisation manuelle du schéma

└── health/
    └── health.controller.ts   # GET /api/health (healthcheck Render)
```

---

## Point d'entrée — `main.ts`

**Fichier** : `backend/src/main.ts`

C'est le premier fichier exécuté quand le serveur démarre.

```typescript
async function bootstrap() {
  // 1. Crée l'application NestJS (charge AppModule → tous les modules)
  const app = await NestFactory.create(AppModule);

  // 2. Lit les origines CORS autorisées depuis .env
  //    FRONTEND_ORIGIN peut contenir plusieurs URLs séparées par des virgules
  //    Défaut : http://localhost:4200
  const frontendOrigins = (process.env.FRONTEND_ORIGIN ?? 'http://localhost:4200')
    .split(',').map(o => o.trim()).filter(o => o.length > 0);

  const isProduction = process.env.NODE_ENV === 'production';

  // 3. CORS (doit être le premier middleware)
  //    En dev   : accepte tous les localhost/127.0.0.1 peu importe le port
  //    En prod  : accepte uniquement les origines listées dans FRONTEND_ORIGIN
  app.enableCors({ origin: ..., credentials: true, methods: [...] });

  // 4. Logger des requêtes (dev uniquement)
  app.use((req, res, next) => { console.log(`${req.method} ${req.url}`); next(); });

  // 5. Parser JSON avec conservation du rawBody (pour vérification webhooks Stripe/Momo)
  app.use(express.json({ verify: (req, res, buf) => { req.rawBody = Buffer.from(buf); } }));

  // 6. Préfixe global : toutes les routes commencent par /api
  app.setGlobalPrefix('api');

  // 7. Serveur de fichiers statiques pour les uploads d'images
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // 8. Filtre global d'exceptions : formate toutes les erreurs en JSON
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 9. Pipe de validation global
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,           // Supprime les champs non déclarés dans le DTO
    forbidNonWhitelisted: true,// Erreur 400 si un champ inconnu est envoyé
    transform: true,           // Convertit automatiquement les types (string → number, etc.)
  }));

  // 10. Swagger / OpenAPI (dev uniquement, accessible sur /api/docs)
  if (!isProduction) {
    const config = new DocumentBuilder()
      .setTitle("C'EMPIRE API")
      .addBearerAuth(...)
      .build();
    SwaggerModule.setup('api/docs', app, SwaggerModule.createDocument(app, config));
  }

  // 11. Démarrage sur le port PORT ou 3000
  await app.listen(Number(process.env.PORT) || 3000);
}
```

---

## Module racine — `AppModule`

**Fichier** : `backend/src/app.module.ts`

Le module racine importe tous les autres et configure l'infrastructure globale.

### Imports principaux

| Import | Rôle |
|--------|------|
| `ConfigModule.forRoot()` | Charge `.env` dans `process.env`, accessible partout |
| `ThrottlerModule.forRoot()` | Rate limiting : 100 req/min par IP (défaut), 10 req/min (strict) |
| `EventEmitterModule.forRoot()` | Bus d'événements interne (ex: `payment.success`) |
| `TypeOrmModule.forRoot()` | Connexion PostgreSQL, chargement automatique des entités |

### Configuration TypeORM

```typescript
TypeOrmModule.forRoot({
  type: 'postgres',
  host: process.env.DB_HOST,
  port: Number(process.env.DB_PORT),
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  autoLoadEntities: true,        // Charge les entités déclarées dans chaque module
  synchronize: process.env.NODE_ENV !== 'production', // Crée/modifie les tables automatiquement en dev
  // En production : synchronize: false → migrations manuelles requises
})
```

> ⚠️ **Important** : En production, `synchronize: false`. Il faut créer les migrations manuellement si le schéma change.

### Guards globaux (ordre critique)

```typescript
// APP_GUARD s'applique à TOUTES les routes, dans cet ordre :
{ provide: APP_GUARD, useClass: JwtAuthGuard }     // 1. Vérifie le JWT
{ provide: APP_GUARD, useClass: RolesGuard }        // 2. Vérifie le rôle
{ provide: APP_GUARD, useClass: PermissionsGuard }  // 3. Vérifie les permissions
```

### Intercepteur global

```typescript
{ provide: APP_INTERCEPTOR, useClass: AuditInterceptor } // Log toutes les requêtes
```

---

## Cycle de vie d'une requête

### Exemple : `POST /api/cshop/orders/checkout`

```
1. [Middleware CORS]
   → Vérifie que l'Origin (http://localhost:4200) est autorisé
   → Ajoute les headers Access-Control-Allow-*

2. [express.json()]
   → Parse { items: [...], deliveryOption: 'free' }
   → Stocke le rawBody pour d'éventuels webhooks

3. [JwtAuthGuard]
   → Extrait le token du header Authorization: Bearer <token>
   → Vérifie la signature avec JWT_ACCESS_SECRET
   → Injecte req.user = { userId, email, role }
   → Si pas de token → 401 Unauthorized

4. [RolesGuard]
   → Lit @Roles() sur la route (ici : aucun, accessible à tous les users)
   → Passe

5. [PermissionsGuard]
   → Vérifie les permissions fines si @Permissions() est présent
   → Passe

6. [AuditInterceptor]
   → Enregistre : méthode, URL, userId, timestamp (before)

7. [ValidationPipe]
   → Valide le body contre CreateOrderDto
   → Supprime les champs inconnus (whitelist)
   → Lance BadRequestException si invalide

8. [OrderController.checkout()]
   → Appelle OrderService.checkout(userId, dto)
   → Retourne { orderId, totalAmount, ... }

9. [AuditInterceptor]
   → Enregistre la réponse et la durée (after)

10. [Client reçoit la réponse]
```

---

## Modules fonctionnels

| Module | Fichier | Services exposés |
|--------|---------|-----------------|
| `AuthModule` | `auth/auth.module.ts` | `AuthService`, `UserService` |
| `UsersModule` | `users/users.module.ts` | `UserService` |
| `CshopModule` | `shop/shop.module.ts` | `OrderService`, `ProductService`, `CartService`… |
| `GrillModule` | `grill/grill.module.ts` | `GrillOrdersService`, `GrillProductsService`… |
| `CexpressModule` | `express/express.module.ts` | `DeliveryService`, `CourierService`… |
| `CCleanModule` | `clean/clean.module.ts` | `CleanBookingsService`, `CleanServicesService`… |
| `CEventModule` | `events/events.module.ts` | `EventService`, `EventBookingService`… |
| `TodoModule` | `todo/todo.module.ts` | `TodoOrderService`, `TodoServicesService`… |
| `PaymentsModule` | `core/payments/payments.module.ts` | `PaymentsService` |
| `NotificationsModule` | `core/notifications/notifications.module.ts` | `NotificationsService` |
| `RolesModule` | `core/roles/roles.module.ts` | `RolesService` |
| `AdminModule` | `admin/admin.module.ts` | `AdminService` |
| `TasksModule` | `tasks/tasks.module.ts` | Tasks management |
| `SectorsModule` | `core/sectors/sectors.module.ts` | `SectorsService` |
| `HighlightsModule` | `core/highlights/highlights.module.ts` | `HighlightsService` |
| `SiteSettingsModule` | `core/site-settings/site-settings.module.ts` | `SiteSettingsService` |

---

## Infrastructure transversale (`core/`)

### `core/filters/http-exception.filter.ts`
Intercepte toutes les exceptions et retourne une réponse JSON uniforme :

```json
{
  "statusCode": 400,
  "message": "email must be an email",
  "error": "Bad Request",
  "timestamp": "2026-03-25T10:30:00.000Z",
  "path": "/api/auth/signin"
}
```

### `core/audit/audit.interceptor.ts`
Intercepteur global qui :
- Enregistre chaque requête entrante (méthode, URL, userId, IP)
- Enregistre la réponse (status, durée en ms)
- Utile pour le debugging et la surveillance

### `core/notifications/`
Service de notifications multi-canal :
- **Email** : via Nodemailer (SMTP Gmail)
- **SMS** : via provider configurable (Twilio/Vonage)
- **WhatsApp** : via provider configurable
- **In-App** : stocké en base de données

---

## Base de données

### Connexion
```
PostgreSQL sur Render (prod) ou localhost:5432 (dev)
Nom de la base : c_empire
Utilisateur    : c_empire_user
```

### Entités principales

```
users                    # Comptes utilisateurs
profiles                 # Profils (1:1 avec users)
roles                    # Rôles personnalisés
sectors                  # Secteurs d'activité

products                 # Produits C'Shop
carts / cart_items       # Paniers
orders / order_items     # Commandes C'Shop
reviews                  # Avis produits
promotions               # Codes promo
relay_points             # Points relais

grill_products           # Produits C'Grill
grill_orders             # Commandes grill
grill_order_items        # Lignes de commandes grill
grill_menu_packs         # Packs menus
grill_menu_pack_items    # Produits dans les packs

deliveries               # Livraisons C'Express
couriers                 # Livreurs
import_exports           # Import/export international

clean_services           # Services nettoyage
clean_bookings           # Réservations nettoyage
clean_quotes             # Devis nettoyage
clean_reviews            # Avis nettoyage

events                   # Événements
event_bookings           # Réservations événements

todo_services            # Services à la demande
todo_orders              # Commandes todo

payments                 # Paiements (toutes sources)
notifications            # Historique notifications
platform_settings        # Configuration site
news_messages            # Actualités
seasonal_campaigns       # Campagnes marketing
```

---

## Sécurité globale

### JWT (JSON Web Token)

- **Access Token** : durée 1h, signé avec `JWT_ACCESS_SECRET`
- **Refresh Token** : durée plus longue, signé avec `JWT_REFRESH_SECRET`
- **Stockage** : `localStorage` côté client (accessToken, refreshToken)
- **Transmission** : Header `Authorization: Bearer <token>`

### Guards

| Guard | Déclenchement | Comportement |
|-------|--------------|-------------|
| `JwtAuthGuard` | Toutes les routes | Vérifie le JWT, skip si `@Public()` ou `OPTIONS` |
| `RolesGuard` | Routes avec `@Roles()` | Vérifie `req.user.role` |
| `PermissionsGuard` | Routes avec `@Permissions()` | Vérifie permissions fines |

### Rate Limiting (ThrottlerModule)

| Profil | Limite | Fenêtre |
|--------|--------|---------|
| `default` | 100 requêtes | 60 secondes |
| `strict` | 10 requêtes | 60 secondes |

Les routes sensibles (paiement, auth) utilisent le profil `strict`.

---

*Voir aussi :*
- *[02-authentification-securite.md](02-authentification-securite.md) pour les détails auth*
- *[10-base-de-donnees.md](10-base-de-donnees.md) pour le schéma complet*
