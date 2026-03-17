# 🗄️ Configuration de la Base de Données PostgreSQL

## Instructions pour initialiser la base de données C'EMPIRE

### Étape 1 : Vérifier que PostgreSQL est installé
```bash
psql --version
```

### Étape 2 : Se connecter à PostgreSQL
```bash
psql -U postgres
```
(Entrez le mot de passe par défaut, généralement "postgres" ou appuyez sur Entrée)

### Étape 3 : Exécuter les commandes SQL

Copiez et exécutez ces commandes dans le terminal `psql` :

```sql
-- Créer l'utilisateur c_empire_user
-- Remplacez le mot de passe par une valeur forte propre à votre environnement.
CREATE ROLE c_empire_user WITH LOGIN PASSWORD 'CHANGE_ME_STRONG_PASSWORD';

-- Créer la base de données c_empire
CREATE DATABASE c_empire OWNER c_empire_user;

-- Donner tous les privilèges
GRANT ALL PRIVILEGES ON DATABASE c_empire TO c_empire_user;

-- Quitter psql
\q
```

### Étape 4 : Vérifier la connexion

Testez la connexion avec le nouvel utilisateur :
```bash
psql -U c_empire_user -d c_empire -h localhost -p 5432
```

Vous devriez voir : `c_empire=>`

Tapez `\q` pour quitter.

### Étape 5 : Relancer le serveur backend

```bash
cd backend
npm start
```

En développement et en test, le backend peut créer les tables automatiquement avec TypeORM tant que `NODE_ENV !== production`.

En production, utilisez des migrations:

```bash
npm run typeorm -- migration:generate src/database/migrations/InitSchema
npm run migration:run
```

---

## Configuration dans .env

Le fichier `.env` doit contenir :
```
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=c_empire_user
DB_PASSWORD=CHANGE_ME_STRONG_PASSWORD
DB_NAME=c_empire
FRONTEND_ORIGIN=http://localhost:4200
```

En production, vous pouvez autoriser plusieurs origines frontend avec une liste séparée par des virgules:
`FRONTEND_ORIGIN=https://app.example.com,https://admin.example.com`

✅ Tout est configuré correctement !
