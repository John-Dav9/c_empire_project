# C'EMPIRE — Plateforme Multi-Services

> Documentation principale du projet · [English version](README.en.md)

## Table des matières

1. [Présentation du projet](#présentation)
2. [Architecture globale](#architecture)
3. [Prérequis](#prérequis)
4. [Installation et démarrage](#installation)
5. [Comptes de test](#comptes-de-test)
6. [Structure des dossiers](#structure)
7. [Services métier](#services-métier)
8. [Documentation détaillée](#documentation-détaillée)
9. [Déploiement](#déploiement)

---

## Présentation

**C'EMPIRE** est une plateforme multi-services tout-en-un conçue pour centraliser plusieurs activités commerciales :

| Service | Route | Description |
|---------|-------|-------------|
| **C'Shop** | `/shop` | E-commerce — vente de produits en ligne |
| **C'Grill** | `/grill` | Restauration — commande de repas |
| **C'Express** | `/express` | Livraison express & import/export |
| **C'Clean** | `/clean` | Services de nettoyage |
| **C'Events** | `/events` | Organisation et réservation d'événements |
| **C'Todo** | `/todo` | Services à la demande (bricolage, etc.) |

### Stack technique

```
Backend  : NestJS 11 · TypeORM · PostgreSQL · Passport JWT · Swagger
Frontend : Angular 20+ · Signals · Material Design · TypeScript strict
Hébergement : Render (backend) · Vercel (frontend) · Supabase/Render Postgres
```

---

## Architecture

```
C'EMPIRE PROJECT/
├── backend/          # API NestJS
│   └── src/
│       ├── auth/         # Authentification & utilisateurs
│       ├── shop/         # C'Shop (e-commerce)
│       ├── grill/        # C'Grill (restauration)
│       ├── express/      # C'Express (livraison)
│       ├── clean/        # C'Clean (nettoyage)
│       ├── events/       # C'Events (événements)
│       ├── todo/         # C'Todo (tâches)
│       ├── tasks/        # Gestion des missions (admin)
│       ├── admin/        # Administration
│       ├── users/        # Gestion des utilisateurs
│       └── core/         # Transversal (paiements, notifs, rôles…)
│
├── frontend/         # Application Angular
│   └── src/app/
│       ├── core/         # Services, guards, interceptors
│       ├── shared/       # Composants réutilisables
│       └── features/     # Pages de l'application
│           ├── auth/        # Connexion / Inscription
│           ├── home/        # Page d'accueil
│           ├── shop/        # C'Shop
│           ├── grill/       # C'Grill
│           ├── express/     # C'Express
│           ├── clean/       # C'Clean
│           ├── events/      # C'Events
│           ├── todo/        # C'Todo
│           ├── payments/    # Paiements
│           ├── profile/     # Profil utilisateur
│           ├── admin/       # Espace admin
│           ├── client/      # Espace client
│           ├── employee/    # Espace employé
│           └── super-admin/ # Espace super administrateur
│
├── docs/             # Documentation détaillée
│   ├── backend/
│   └── frontend/
│
└── render.yaml       # Configuration déploiement Render
```

---

## Prérequis

| Outil | Version minimale |
|-------|-----------------|
| Node.js | 18+ |
| npm | 9+ |
| PostgreSQL | 14+ |
| Angular CLI | 17+ |

---

## Installation

### 1. Cloner le projet

```bash
git clone <url-du-repo>
cd "C'EMPIRE PROJECT"
```

### 2. Backend

```bash
cd backend

# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env
# Modifier .env avec vos valeurs (DB, JWT, mail, etc.)

# Initialiser la base de données (optionnel, TypeORM synchronize le fait automatiquement en dev)
npm run db:bootstrap

# Peupler les données de test
npm run seed:test-users

# Lancer en développement
npm run start:dev
```

Le backend est disponible sur `http://localhost:3000/api`
La documentation Swagger est sur `http://localhost:3000/api/docs`

### 3. Frontend

```bash
cd frontend
npm install
npm run start:dev   # http://localhost:4200
```

---

## Variables d'environnement

### Backend (`.env`)

```env
# Base de données PostgreSQL
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=c_empire_user
DB_PASSWORD=empire123
DB_NAME=c_empire

# JWT
JWT_ACCESS_SECRET=dev_access_secret_key_change_in_production
JWT_REFRESH_SECRET=dev_refresh_secret_key_change_in_production
JWT_EXPIRATION=3600s

# CORS (frontend autorisé)
FRONTEND_ORIGIN=http://localhost:4200,http://127.0.0.1:4200

# URL de l'application
APP_BASE_URL=http://localhost:4200

# Email (Nodemailer)
MAIL_HOST=smtp.gmail.com
MAIL_PORT=587
MAIL_USER=ton-email@gmail.com
MAIL_PASS=ton-app-password
MAIL_FROM=no-reply@cempire.com

# Paiements
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Admin
ADMIN_DEFAULT_PASSWORD=ChangeMe123!
```

### Frontend (`public/config.js`)

```javascript
// En développement → laisser vide (utilise localhost:3000 automatiquement)
window.__CEMPIRE_CONFIG__ = { apiBaseUrl: '' };

// En production → mettre l'URL du backend Render
window.__CEMPIRE_CONFIG__ = { apiBaseUrl: 'https://c-empire.onrender.com/api' };
```

---

## Comptes de test

Après `npm run seed:test-users` :

| Rôle | Email | Mot de passe |
|------|-------|-------------|
| Super Admin | `superadmin@cempire.com` | `ChangeMe123!` |
| Admin | `admin@cempire.com` | `ChangeMe123!` |
| Client | `client@cempire.com` | `ChangeMe123!` |
| Livreur | `livreur@cempire.com` | `ChangeMe123!` |
| Événementialiste | `events@cempire.com` | `ChangeMe123!` |
| Coursier | `coursier@cempire.com` | `ChangeMe123!` |
| Nettoyeur | `nettoyeur@cempire.com` | `ChangeMe123!` |
| Bricoleur | `bricoleur@cempire.com` | `ChangeMe123!` |
| Point Relais | `relais@cempire.com` | `ChangeMe123!` |

---

## Rôles et accès

```
super_admin → Accès total à tout le back-office
admin       → Gestion des opérations quotidiennes
employee    → Missions assignées (sous-rôles : livreur, nettoyeur, etc.)
client      → Commandes, réservations, suivi
```

### Sous-rôles employé (`specialty`)

| Valeur | Description |
|--------|-------------|
| `livreur` | Livraisons C'Express |
| `evenementialiste` | Gestion d'événements |
| `coursier` | Courses rapides |
| `nettoyeur` | Services nettoyage |
| `bricoleur` | Services à la demande |
| `point_relais` | Boutique point relais |

---

## Structure des dossiers

→ Voir [docs/backend/01-architecture-backend.md](docs/backend/01-architecture-backend.md)
→ Voir [docs/frontend/01-architecture-frontend.md](docs/frontend/01-architecture-frontend.md)

---

## Services métier

| Service | Documentation |
|---------|--------------|
| C'Shop | [docs/backend/03-module-cshop.md](docs/backend/03-module-cshop.md) |
| C'Grill | [docs/backend/04-module-cgrill.md](docs/backend/04-module-cgrill.md) |
| C'Express | [docs/backend/05-module-cexpress.md](docs/backend/05-module-cexpress.md) |
| C'Clean | [docs/backend/06-module-cclean.md](docs/backend/06-module-cclean.md) |
| C'Events | [docs/backend/07-module-cevents.md](docs/backend/07-module-cevents.md) |
| C'Todo | [docs/backend/08-module-ctodo.md](docs/backend/08-module-ctodo.md) |
| Paiements | [docs/backend/09-paiements.md](docs/backend/09-paiements.md) |
| Base de données | [docs/backend/10-base-de-donnees.md](docs/backend/10-base-de-donnees.md) |

---

## Documentation détaillée

```
docs/
├── backend/
│   ├── 01-architecture-backend.md       # Architecture NestJS, modules, flux
│   ├── 02-authentification-securite.md  # JWT, guards, rôles
│   ├── 03-module-cshop.md               # E-commerce complet
│   ├── 04-module-cgrill.md              # Restauration
│   ├── 05-module-cexpress.md            # Livraison express
│   ├── 06-module-cclean.md              # Nettoyage
│   ├── 07-module-cevents.md             # Événements
│   ├── 08-module-ctodo.md               # Services à la demande
│   ├── 09-paiements.md                  # Système de paiement
│   ├── 10-base-de-donnees.md            # Schéma BDD, entités
│   ├── 11-admin-super-admin.md          # Espace administration
│   └── 12-configuration-deploiement.md # Config, déploiement
│
├── frontend/
│   ├── 01-architecture-frontend.md      # Architecture Angular
│   ├── 02-auth-routing.md               # Auth, routes, guards
│   ├── 03-services-core.md              # Services Angular
│   ├── 04-modules-metier.md             # Features/pages
│   ├── 05-super-admin-interface.md      # Interface admin
│   └── 06-composants-partages.md        # Composants réutilisables
│
├── api/
│   ├── reference-api.md                 # Référence API complète (FR)
│   └── api-reference.en.md              # Complete API reference (EN)
│
├── deploiement.md                        # Guide de déploiement (FR)
└── deployment.en.md                      # Deployment guide (EN)
```

---

## Déploiement

| Service | Plateforme | URL |
|---------|-----------|-----|
| Backend (API) | Render | `https://c-empire.onrender.com` |
| Frontend | Vercel | `https://c-empire.vercel.app` |
| Base de données | Render PostgreSQL | (privé) |

→ Guide complet : [docs/deploiement.md](docs/deploiement.md)

---

## Scripts utiles

### Backend

```bash
npm run start:dev          # Dev avec hot-reload
npm run start:prod         # Production
npm run build              # Compiler TypeScript
npm run seed:test-users    # Créer comptes de test
npm run seed:demo          # Données de démonstration
npm run seed:admin         # Créer compte admin
npm run migrate:delivery-options  # Migration manuelle enum livraison
```

### Frontend

```bash
npm run start:dev   # Dev (port 4200)
npm run build       # Build production
npm run typecheck   # Vérification TypeScript
```

---

*Documentation générée le 25/03/2026 · C'EMPIRE PROJECT*
