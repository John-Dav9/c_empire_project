# Configuration & Déploiement Backend

> Render · PostgreSQL · Variables d'environnement

## Variables d'environnement complètes

```env
# ── Base de données ──────────────────────────────────────────────
DB_HOST=127.0.0.1          # En prod : host Render PostgreSQL
DB_PORT=5432
DB_USER=c_empire_user
DB_PASSWORD=empire123
DB_NAME=c_empire

# ── JWT ──────────────────────────────────────────────────────────
JWT_ACCESS_SECRET=dev_access_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production
JWT_EXPIRATION=3600s        # Durée de l'access token

# ── CORS ─────────────────────────────────────────────────────────
FRONTEND_ORIGIN=http://localhost:4200,http://127.0.0.1:4200
# En prod : FRONTEND_ORIGIN=https://ton-site.vercel.app

# ── Application ──────────────────────────────────────────────────
APP_BASE_URL=http://localhost:4200   # URL du frontend (pour les liens email)
NODE_ENV=production                  # ou 'development'
PORT=3000

# ── Email (Nodemailer) ───────────────────────────────────────────
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tonEmail@gmail.com
MAIL_PASS=tonAppPassword             # App password Gmail, pas ton mot de passe
MAIL_FROM=no-reply@cempire.com

# ── Paiements Stripe ─────────────────────────────────────────────
STRIPE_SECRET_KEY=sk_live_...        # Ou sk_test_... en dev
STRIPE_WEBHOOK_SECRET=whsec_...

# ── Paiements Mobile Money ───────────────────────────────────────
MTN_WEBHOOK_SECRET=...
ORANGE_WEBHOOK_SECRET=...
PAYMENT_WEBHOOK_SECRET=...
PAYMENT_WEBHOOK_STRICT=true          # Valider les signatures en prod

# ── Comportement paiement ────────────────────────────────────────
ALLOW_MOCK_PAYMENTS=false            # true en dev pour tester sans vrai provider
CEXPRESS_PROVIDER=disabled           # ou 'enabled'
SMS_PROVIDER=disabled
WHATSAPP_PROVIDER=disabled

# ── Admin ────────────────────────────────────────────────────────
ADMIN_DEFAULT_PASSWORD=ChangeMe123!  # Mot de passe par défaut des comptes seedés
```

---

## Déploiement Render

### Configuration `render.yaml`

```yaml
services:
  - type: web
    name: cempire-backend
    runtime: node
    rootDir: backend
    autoDeploy: true              # Déploiement auto à chaque push git
    buildCommand: npm ci && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /api/health  # Vérifie que l'API répond
    envVars:
      - key: NODE_ENV
        value: production
      - key: PORT
        value: 3000
      # ... autres variables
```

### Health Check

**Fichier** : `backend/src/health/health.controller.ts`

```typescript
@Controller('health')
export class HealthController {
  @Get()
  check() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
```

Route : `GET /api/health` → `{ status: 'ok', timestamp: '...' }`

Render appelle cette route toutes les 30 secondes pour vérifier que le serveur fonctionne.

### Processus de déploiement sur Render

```
1. git push origin main
   ↓
2. Render détecte le push (autoDeploy: true)
   ↓
3. npm ci                    # Installe les dépendances proprement
   ↓
4. npm run build             # Compile TypeScript → dist/
   ↓
5. npm run start:prod        # node dist/main
   ↓
6. GET /api/health → 200     # Render valide le déploiement
   ↓
7. Traffic redirigé vers la nouvelle version
```

### Variables à configurer manuellement dans Render Dashboard

Les variables marquées `sync: false` dans `render.yaml` **doivent être définies manuellement** dans le dashboard Render :

- `FRONTEND_ORIGIN` → URL Vercel du frontend
- `APP_BASE_URL` → URL Vercel du frontend
- `ADMIN_DEFAULT_PASSWORD`
- `STRIPE_SECRET_KEY`
- `STRIPE_WEBHOOK_SECRET`
- `PAYMENT_WEBHOOK_SECRET`
- `MAIL_HOST`, `MAIL_USER`, `MAIL_PASS`, `MAIL_FROM`

> Pour `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET`, Render les génère automatiquement (`generateValue: true`).

---

## Déploiement Vercel (Frontend)

### Configuration `frontend/vercel.json`

```json
{
  "rewrites": [
    { "source": "/(.*)", "destination": "/index.html" }
  ],
  "headers": [
    {
      "source": "/config.js",
      "headers": [{ "key": "Cache-Control", "value": "no-store" }]
    }
  ]
}
```

Le rewrite `/(.*) → /index.html` permet le routing Angular (SPA) : toutes les URLs retournent `index.html` et Angular gère le routing côté client.

Le header `no-store` sur `config.js` empêche le cache navigateur de garder l'ancienne config.

### Variables Vercel

Dans le dashboard Vercel → Settings → Environment Variables :

| Variable | Valeur | Description |
|----------|--------|-------------|
| `API_BASE_URL` | `https://c-empire.onrender.com/api` | URL du backend Render |

### Script d'injection config (`frontend/scripts/build-safe.js`)

Avant de builder Angular, ce script génère `public/config.js` depuis le template :

```javascript
const apiBaseUrl = process.env.API_BASE_URL || '';
if (apiBaseUrl) {
  const template = fs.readFileSync('public/config.template.js', 'utf8');
  fs.writeFileSync('public/config.js', template.replace('${API_BASE_URL}', apiBaseUrl));
}
```

Résultat en prod :
```javascript
// public/config.js (généré automatiquement)
window.__CEMPIRE_CONFIG__ = {
  apiBaseUrl: 'https://c-empire.onrender.com/api',
};
```

---

## Commandes utiles en production

```bash
# Vérifier que l'API répond
curl https://c-empire.onrender.com/api/health

# Se connecter avec l'admin
curl -X POST https://c-empire.onrender.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cempire.com","password":"ChangeMe123!"}'

# Lister les produits (route publique)
curl https://c-empire.onrender.com/api/cshop/products
```

---

## Commandes utiles en développement

```bash
cd backend

# Démarrer le serveur avec hot-reload
npm run start:dev

# Build TypeScript (sans démarrer)
npm run build

# Vérification de types sans compiler
npm run typecheck

# Créer les comptes de test
npm run seed:test-users

# Remplir la base avec des données de démo
npm run seed:demo

# Créer un compte admin seul
npm run seed:admin

# Réinitialiser le mot de passe admin
npm run reset:admin-password

# Migration de l'enum deliveryOption (à faire une seule fois)
npm run migrate:delivery-options

# Vérifier la connexion admin
npm run check:admin-login

# Lancer les tests unitaires
npm test

# Lancer les tests avec couverture
npm run test:cov

# Lancer les tests e2e
npm run test:e2e
```
