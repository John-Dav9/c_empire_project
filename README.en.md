# C'EMPIRE — Multi-Service Platform

> Main documentation (English) · [Version française](README.md)

## Overview

**C'EMPIRE** is an all-in-one multi-service platform centralizing several business activities:

| Service | Route | Description |
|---------|-------|-------------|
| **C'Shop** | `/shop` | E-commerce — online product sales |
| **C'Grill** | `/grill` | Food ordering & delivery |
| **C'Express** | `/express` | Express delivery & import/export |
| **C'Clean** | `/clean` | Cleaning services |
| **C'Events** | `/events` | Event organization & booking |
| **C'Todo** | `/todo` | On-demand services (handyman, etc.) |

## Tech Stack

```
Backend  : NestJS 11 · TypeORM · PostgreSQL · Passport JWT · Swagger
Frontend : Angular 20+ · Signals · Material Design · TypeScript strict
Hosting  : Render (backend) · Vercel (frontend) · PostgreSQL
```

## Quick Start

### Backend

```bash
cd backend
npm install
# Configure .env (see Variables section)
npm run seed:test-users   # Create test accounts
npm run start:dev         # http://localhost:3000/api
# Swagger docs: http://localhost:3000/api/docs
```

### Frontend

```bash
cd frontend
npm install
npm run start:dev         # http://localhost:4200
```

## Test Accounts

After running `npm run seed:test-users`:

| Role | Email | Password |
|------|-------|----------|
| Super Admin | `superadmin@cempire.com` | `ChangeMe123!` |
| Admin | `admin@cempire.com` | `ChangeMe123!` |
| Client | `client@cempire.com` | `ChangeMe123!` |
| Delivery driver | `livreur@cempire.com` | `ChangeMe123!` |
| Event specialist | `events@cempire.com` | `ChangeMe123!` |
| Courier | `coursier@cempire.com` | `ChangeMe123!` |
| Cleaner | `nettoyeur@cempire.com` | `ChangeMe123!` |
| Handyman | `bricoleur@cempire.com` | `ChangeMe123!` |
| Relay point | `relais@cempire.com` | `ChangeMe123!` |

## User Roles

```
super_admin → Full back-office access
admin       → Daily operations management
employee    → Assigned missions (sub-roles: driver, cleaner, etc.)
client      → Orders, bookings, tracking
```

## Documentation

```
docs/
├── backend/
│   ├── 01-architecture-backend.md
│   ├── 02-authentification-securite.md
│   ├── 03-module-cshop.md
│   ├── 04-module-cgrill.md
│   ├── 05-module-cexpress.md
│   ├── 06-module-cclean.md
│   ├── 07-module-cevents.md
│   ├── 08-module-ctodo.md
│   ├── 09-paiements.md
│   ├── 10-base-de-donnees.md
│   ├── 11-admin-super-admin.md
│   └── 12-configuration-deploiement.md
├── frontend/
│   ├── 01-architecture-frontend.md
│   ├── 02-auth-routing.md
│   ├── 03-services-core.md
│   ├── 04-modules-metier.md
│   └── 05-super-admin-interface.md
├── api/
│   └── reference-api.md
└── deploiement.md
```

## Deployment

| Service | Platform | URL |
|---------|----------|-----|
| Backend (API) | Render | `https://c-empire.onrender.com` |
| Frontend | Vercel | `https://c-empire.vercel.app` |
| Database | Render PostgreSQL | (private) |

## Key Environment Variables

### Backend (`.env`)

```env
DB_HOST=127.0.0.1
DB_PORT=5432
DB_USER=c_empire_user
DB_PASSWORD=empire123
DB_NAME=c_empire

JWT_ACCESS_SECRET=dev_secret
JWT_REFRESH_SECRET=dev_refresh_secret

FRONTEND_ORIGIN=http://localhost:4200
APP_BASE_URL=http://localhost:4200

MAIL_HOST=smtp.gmail.com
MAIL_USER=your@email.com
MAIL_PASS=your-app-password

STRIPE_SECRET_KEY=sk_test_...
ADMIN_DEFAULT_PASSWORD=ChangeMe123!
```

### Frontend (`public/config.js`)

```javascript
// Development (empty = auto-detect localhost:3000)
window.__CEMPIRE_CONFIG__ = { apiBaseUrl: '' };

// Production (set by Vercel build script from API_BASE_URL env var)
window.__CEMPIRE_CONFIG__ = { apiBaseUrl: 'https://c-empire.onrender.com/api' };
```

## Useful Commands

```bash
# Backend
npm run start:dev              # Development with hot-reload
npm run build                  # Compile TypeScript
npm run seed:test-users        # Create test accounts
npm run seed:demo              # Load demo data
npm run migrate:delivery-options  # Manual DB migration
npm test                       # Run unit tests

# Frontend
npm run start:dev              # Development (port 4200)
npm run build                  # Production build
npm run typecheck              # TypeScript check only
```

*Documentation generated 2026-03-25 · C'EMPIRE PROJECT*
