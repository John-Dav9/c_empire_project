# Deploiement

## Option 1: Docker Compose sur VPS

Fichiers fournis:
- `docker-compose.prod.yml`
- `.env.prod.example`
- `backend/Dockerfile`
- `frontend/Dockerfile`

Etapes:

```bash
cp .env.prod.example .env.prod
docker compose --env-file .env.prod -f docker-compose.prod.yml build
docker compose --env-file .env.prod -f docker-compose.prod.yml up -d
```

Services exposes par defaut:
- frontend: `http://localhost:8080`
- backend: `http://localhost:3000/api`

Ajoute ensuite un reverse proxy TLS devant `8080` et `3000`, ou fais pointer le frontend vers l'URL publique de l'API via `API_BASE_URL`.

## Option 2: Render Blueprint

Fichier fourni:
- `render.yaml`

Etapes:
1. Pousser le repo sur GitHub/GitLab.
2. Creer un Blueprint Render depuis le repo.
3. Renseigner les variables `sync: false` dans le dashboard.
4. Mettre `APP_BASE_URL`, `FRONTEND_ORIGIN` et `API_BASE_URL` avec les vraies URLs.

## Option 3: Railway

Railway detecte les `Dockerfile` de service.

Configuration recommandee:
- un service backend depuis `backend/Dockerfile`
- un service frontend depuis `frontend/Dockerfile`
- un PostgreSQL manage Railway

Variables backend:
- `DB_*`
- `JWT_*`
- `ADMIN_DEFAULT_PASSWORD`
- `APP_BASE_URL`
- `FRONTEND_ORIGIN`

Variable frontend:
- `API_BASE_URL`

## Runtime frontend

Le frontend charge `/config.js` au demarrage. Dans le container Nginx, ce fichier est genere a partir de `public/config.template.js`.

Variable supportee:
- `API_BASE_URL`

Exemples:
- meme domaine avec reverse proxy: `/api`
- API separee: `https://api.example.com/api`

## Recommandations prod

- ne pas exposer PostgreSQL publiquement sauf besoin explicite
- garder `ALLOW_MOCK_PAYMENTS=false`
- garder `CEXPRESS_PROVIDER=disabled`, `SMS_PROVIDER=disabled`, `WHATSAPP_PROVIDER=disabled` tant qu'il n'y a pas d'integration reelle
- activer `PAYMENT_WEBHOOK_STRICT=true` en prod
- stocker `uploads/` sur un volume persistant ou un object storage
