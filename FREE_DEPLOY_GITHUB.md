# Guide GitHub -> Vercel Free + Render Free + Supabase Free

Ce guide suppose:
- repo pousse sur GitHub
- frontend dans `frontend/`
- backend dans `backend/`

## 1. Preparer Supabase

1. Creer un compte sur Supabase.
2. Creer un nouveau projet Free.
3. Attendre que la base soit provisionnee.
4. Ouvrir `Project Settings` -> `Database`.
5. Recuperer:
   - `host`
   - `port`
   - `database name`
   - `user`
   - `password`
   - la chaine de connexion si tu preferes copier les infos depuis l'URI

## 2. Initialiser le schema une seule fois

Le backend en production n'active pas `synchronize`, donc il faut initialiser le schema avant le premier vrai lancement.

Depuis ton terminal local, dans `backend/`, execute:

```bash
$env:DB_HOST="..."
$env:DB_PORT="5432"
$env:DB_USER="..."
$env:DB_PASSWORD="..."
$env:DB_NAME="..."
$env:JWT_ACCESS_SECRET="temp"
$env:JWT_REFRESH_SECRET="temp"
$env:ADMIN_DEFAULT_PASSWORD="ChangeMe123!"
npm run db:bootstrap
npm run seed:admin
```

Tu peux ensuite effacer ces variables de session locale.

Optionnel:

```bash
npm run seed
```

## 3. Deployer le backend sur Render Free

1. Aller sur Render.
2. `New` -> `Blueprint`.
3. Connecter le repo GitHub.
4. Choisir `render.yaml`.
5. Valider la creation du service `cempire-backend`.
6. Dans les variables d'environnement Render, renseigner:
   - `APP_BASE_URL`
   - `FRONTEND_ORIGIN`
   - `DB_HOST`
   - `DB_PORT`
   - `DB_NAME`
   - `DB_USER`
   - `DB_PASSWORD`
   - `JWT_ACCESS_SECRET`
   - `JWT_REFRESH_SECRET`
   - `ADMIN_DEFAULT_PASSWORD`
   - `ALLOW_MOCK_PAYMENTS=false`
   - `CEXPRESS_PROVIDER=disabled`
   - `SMS_PROVIDER=disabled`
   - `WHATSAPP_PROVIDER=disabled`
   - `PAYMENT_WEBHOOK_STRICT=false` au debut, puis `true` quand les signatures sont en place
7. Lancer le deploy.
8. Verifier:

```text
https://<ton-backend>.onrender.com/api/health
```

Important:
- Render Free endort le backend apres 15 minutes d'inactivite.
- Le premier reveil peut prendre jusqu'a environ une minute.

## 4. Deployer le frontend sur Vercel Free

1. Aller sur Vercel.
2. `Add New` -> `Project`.
3. Importer le meme repo GitHub.
4. Configurer:
   - `Root Directory`: `frontend`
   - Framework: Angular
   - Build command: laisser la valeur detectee ou `npm run build`
   - Output directory: laisser la valeur detectee
5. Ajouter la variable d'environnement:
   - `API_BASE_URL=https://<ton-backend>.onrender.com/api`
6. Deploy.

Le frontend charge `config.js` au runtime, donc cette variable suffit pour cibler le backend Render.

## 5. Finaliser la liaison front -> back

Une fois le frontend Vercel disponible:

1. Copier l'URL Vercel, par exemple:

```text
https://cempire-front.vercel.app
```

2. Revenir sur Render et mettre:
   - `APP_BASE_URL=https://cempire-front.vercel.app`
   - `FRONTEND_ORIGIN=https://cempire-front.vercel.app`

3. Redeployer le backend Render.

## 6. Verifier l'autodeploiement GitHub

Ensuite, le comportement attendu est:
- push sur `main`
- Vercel rebuild et redeploie le frontend
- Render rebuild et redeploie le backend

La base Supabase ne se redeploie pas. Elle reste persistante.

## 7. Quand tu modifies la base plus tard

Pour l'instant, le projet n'a pas encore de vraies migrations versionnees initiales.

Donc si tu modifies les entites:
- soit tu ajoutes une vraie migration TypeORM avant de pousser
- soit tu relances `npm run db:bootstrap` manuellement contre Supabase si tu assumes un sync explicite

Pour une vraie prod stable, la suite logique sera d'ajouter des migrations TypeORM committees.

## 8. Limites du mode gratuit

- Vercel Hobby: usage perso, parfait pour demarrer
- Render Free: backend en veille apres inactivite
- Supabase Free: limites de stockage/egress et projet possiblement pause si inactif trop longtemps
