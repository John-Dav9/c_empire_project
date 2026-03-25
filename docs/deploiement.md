# Guide de Déploiement — C'EMPIRE

> Render (Backend) · Vercel (Frontend) · PostgreSQL

## Architecture de déploiement

```
Internet
  │
  ├──► https://c-empire.vercel.app      (Frontend Angular)
  │         │
  │         └──► https://c-empire.onrender.com/api  (Backend NestJS)
  │                   │
  │                   └──► Render PostgreSQL  (Base de données)
```

---

## Déploiement du Backend sur Render

### Prérequis
- Compte Render (render.com)
- Repository Git avec le code
- Base de données PostgreSQL sur Render (ou Supabase)

### Étapes

#### 1. Créer le service Web

Sur render.com → New → Web Service

```yaml
# render.yaml (déjà configuré)
services:
  - type: web
    name: cempire-backend
    runtime: node
    rootDir: backend
    autoDeploy: true
    buildCommand: npm ci && npm run build
    startCommand: npm run start:prod
    healthCheckPath: /api/health
```

#### 2. Configurer les variables d'environnement

Dans le dashboard Render → ton service → Environment :

```
NODE_ENV=production
PORT=3000

# Automatiquement configuré par Render (fromDatabase)
DB_HOST=...        # Host Render PostgreSQL
DB_PORT=5432
DB_NAME=cempire_db
DB_USER=cempire_user
DB_PASSWORD=...

# Généré automatiquement par Render (generateValue: true)
JWT_ACCESS_SECRET=...
JWT_REFRESH_SECRET=...

# À configurer manuellement (sync: false)
FRONTEND_ORIGIN=https://ton-site.vercel.app
APP_BASE_URL=https://ton-site.vercel.app
ADMIN_DEFAULT_PASSWORD=TonMotDePasseAdmin!

MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=tonEmail@gmail.com
MAIL_PASS=ton-app-password-gmail
MAIL_FROM=no-reply@cempire.com

STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

PAYMENT_WEBHOOK_STRICT=true
ALLOW_MOCK_PAYMENTS=false

CEXPRESS_PROVIDER=disabled
SMS_PROVIDER=disabled
WHATSAPP_PROVIDER=disabled
```

#### 3. Déployer

```bash
# Commit et push sur la branche principale
git add .
git commit -m "Deploy to Render"
git push origin main
# → Render détecte le push et redéploie automatiquement
```

#### 4. Vérifier le déploiement

```bash
# Health check
curl https://c-empire.onrender.com/api/health
# → {"status":"ok","timestamp":"..."}

# Test connexion
curl -X POST https://c-empire.onrender.com/api/auth/signin \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@cempire.com","password":"TonMotDePasseAdmin!"}'
```

#### 5. Initialiser la base de données

```bash
# Si la DB est vide, initialiser depuis local en pointant vers la DB prod
# (Modifier temporairement le .env avec les credentials Render)
npm run seed:admin       # Compte admin
npm run seed:test-users  # Comptes de test
```

---

## Déploiement du Frontend sur Vercel

### Prérequis
- Compte Vercel (vercel.com)
- Repository Git

### Étapes

#### 1. Importer le projet

Sur vercel.com → New Project → Import depuis GitHub

Configuration du projet :
```
Root Directory      : frontend
Build Command       : npm run build
Output Directory    : dist/frontend/browser
Install Command     : npm ci
```

#### 2. Configurer les variables d'environnement

Dans Vercel → ton projet → Settings → Environment Variables :

```
API_BASE_URL=https://c-empire.onrender.com/api
```

> **Note** : Cette variable est utilisée par `build-safe.js` pour générer `public/config.js` au moment du build.

#### 3. Déployer

```bash
git push origin main
# → Vercel rebuilde automatiquement
```

#### 4. Vérifier

- Ouvrir `https://ton-site.vercel.app`
- Tester la connexion avec les identifiants admin
- Vérifier dans DevTools → Network que les requêtes vont bien vers Render

---

## Configuration des Webhooks Stripe

Pour que Stripe puisse notifier le backend des paiements :

1. Aller sur **dashboard.stripe.com → Developers → Webhooks**
2. Ajouter un endpoint : `https://c-empire.onrender.com/api/payments/webhook/stripe`
3. Événements à écouter : `checkout.session.completed`, `payment_intent.succeeded`
4. Copier le `Signing secret` → le mettre dans `STRIPE_WEBHOOK_SECRET` sur Render

---

## Workflow de déploiement (résumé)

```
Développement local
  │
  ├── Tester les changements
  ├── git add . && git commit -m "message"
  └── git push origin main
           │
           ├──► Render : build → deploy → healthcheck ✅
           └──► Vercel : build (avec API_BASE_URL) → deploy ✅
```

---

## Gestion des migrations de base de données

En production, `synchronize: false`. Tout changement de schéma doit être géré manuellement.

### Cas 1 : Nouvelle colonne nullable

```sql
-- Exemple : ajouter la colonne "specialty" à users
ALTER TABLE users ADD COLUMN specialty VARCHAR;
```

### Cas 2 : Changement d'un enum

Voir `backend/src/migrate-delivery-options.ts` comme exemple de migration.

```bash
# En local, pointer vers la DB prod dans .env, puis exécuter :
npm run migrate:delivery-options
```

### Cas 3 : Nouvelle table

Laisser TypeORM la créer automatiquement lors du premier démarrage :
- Activer temporairement `synchronize: true`
- Déployer
- Redésactiver `synchronize: false`
- Redéployer

---

## Surveillance et logs

### Logs Render

Dans le dashboard Render → ton service → Logs

Chercher :
- `Nest application successfully started` → serveur démarré ✅
- `🚀 API running on http://localhost:3000/api` → API opérationnelle ✅
- `ERROR` ou `FATAL` → problème à investiguer ❌

### Health Check

Render appelle automatiquement `/api/health` toutes les 30 secondes.
Si 3 checks consécutifs échouent → le service est marqué comme "Unhealthy" et redémarré.

---

## Dépannage courant

### ❌ Le backend ne démarre pas

**Symptôme** : Render logs montrent une erreur au démarrage

**Causes possibles** :
1. Variable d'environnement manquante → vérifier les env vars Render
2. Connexion DB impossible → vérifier les credentials DB
3. Erreur TypeScript à la compilation → `npm run build` en local pour reproduire

---

### ❌ CORS Error (status 0 dans Angular)

**Symptôme** : Le frontend ne peut pas appeler le backend

**Solution** :
1. Vérifier `FRONTEND_ORIGIN` dans Render = URL exacte de Vercel
2. Pas de slash final dans l'URL : `https://mon-site.vercel.app` ✅ (pas `https://mon-site.vercel.app/`)

---

### ❌ 405 Method Not Allowed en production

**Symptôme** : POST /api/auth/signin retourne 405

**Solutions** :
1. Vérifier les logs Render pour les erreurs de démarrage
2. Redémarrer le service manuellement depuis Render
3. Vérifier que le build s'est terminé correctement

---

### ❌ config.js pointe vers le mauvais backend

**Symptôme** : En production, le frontend appelle localhost:3000

**Solution** :
- Vérifier que `API_BASE_URL` est défini dans Vercel
- Forcer un nouveau déploiement Vercel

**Symptôme** : En développement, le frontend appelle la prod Render

**Solution** :
```javascript
// frontend/public/config.js
window.__CEMPIRE_CONFIG__ = { apiBaseUrl: '' }; // Vider la valeur
```

---

### ❌ Tokens JWT invalides après redéploiement Render

**Cause** : `JWT_ACCESS_SECRET` et `JWT_REFRESH_SECRET` changent à chaque déploiement si `generateValue: true`

**Conséquence** : Tous les utilisateurs connectés sont déconnectés

**Solution** : Définir des secrets fixes dans les env vars Render (pas `generateValue`)
