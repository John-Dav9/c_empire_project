# Backend C'EMPIRE

API NestJS du monorepo C'EMPIRE.

## Démarrage

```bash
npm install
cp .env.example .env
npm run start:dev
```

Healthcheck:

```bash
GET http://localhost:3000/api/health
```

## Variables requises

Secrets obligatoires:
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `ADMIN_DEFAULT_PASSWORD`

Base de données:
- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

Frontend:
- `FRONTEND_ORIGIN`
- `APP_BASE_URL`

Paiements:
- `STRIPE_SECRET_KEY` si Stripe est activé
- `MTN_*` si MTN MoMo est activé
- `ORANGE_*` si Orange Money est activé

Webhooks:
- `PAYMENT_WEBHOOK_STRICT=true` force une signature valide
- `PAYMENT_WEBHOOK_SECRET`, `MTN_WEBHOOK_SECRET`, `ORANGE_WEBHOOK_SECRET` selon les providers utilisés

Intégrations externes:
- `CEXPRESS_PROVIDER=disabled|mock`
- `SMS_PROVIDER=disabled|mock`
- `WHATSAPP_PROVIDER=disabled|mock`

En production, `disabled` est la valeur par défaut recommandée tant qu'une vraie intégration n'est pas livrée.

## Base de données et migrations

En développement et en test, TypeORM peut synchroniser le schéma automatiquement tant que `NODE_ENV !== production`.

En production:
- ne pas utiliser `synchronize`
- générer une migration avant déploiement
- appliquer la migration pendant le rollout

Commandes disponibles:

```bash
npm run typeorm -- migration:generate src/database/migrations/NomMigration
npm run migration:run
npm run migration:revert
```

Le datasource CLI est défini dans `src/database/data-source.ts`.

## Seed

```bash
npm run seed
npm run seed:admin
npm run seed:demo
```

Scripts utilitaires:

```bash
npm run reset:admin-password
npm run check:admin-login
```

## Qualité

```bash
npm run format
npm run lint
npm run typecheck
npm run typecheck:test
npm test
npm run test:e2e
npm run build
```

## E2E local frontend + backend

Créer `backend/.env.e2e` à partir de `.env.e2e.example`, puis:

```bash
npm run start:e2e
```

Ce mode sert au test Playwright live du frontend contre l'API réelle locale.

## Déploiement production

Checklist minimale:
- secrets injectés par le runtime, jamais committés
- `NODE_ENV=production`
- `FRONTEND_ORIGIN` limité aux domaines réels
- providers externes explicitement configurés ou désactivés
- migrations appliquées avant ouverture du trafic
- endpoint `/api/health` supervisé
- logs centralisés
