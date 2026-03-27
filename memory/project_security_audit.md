---
name: Security Audit — Exposition de fichiers sensibles
description: Résultats de l'audit sécurité (mars 2026) suite aux alertes GitHub sur les secrets exposés
type: project
---

GitHub a envoyé des alertes de sécurité concernant des secrets exposés.

**Cause principale identifiée :** Le fichier `frontend/public/config.js` a été commité dans le commit `89d88c2` avec l'URL de production réelle `https://c-empire.onrender.com/api`, ce qui a déclenché le secret scanning de GitHub.

**Corrections appliquées (2026-03-27) :**
1. Créé `.gitignore` à la racine du projet (il n'existait pas)
2. Ajouté `public/config.js` à `frontend/.gitignore` — c'est un fichier runtime généré par `build-safe.js` (Vercel) ou le docker entrypoint, il ne doit jamais être commité
3. Retiré `frontend/public/config.js` du tracking git avec `git rm --cached`
4. Renforcé `backend/.gitignore` : ajout `.env.*`, `.env.e2e`, `/uploads/`, `*.pem`, `*.key`
5. Créé `.git/hooks/pre-commit` : hook de détection de secrets (clés Stripe, URLs de prod, fichiers .env, clés privées)

**État des secrets en prod :**
- Backend déployé sur Render.com (`c-empire.onrender.com`) — `render.yaml` utilise `sync: false` et `generateValue: true` pour tous les secrets → SÉCURISÉ
- Frontend déployé sur Vercel (`cempire-front.vercel.app`) — `API_BASE_URL` injecté via `build-safe.js` à la compilation → SÉCURISÉ
- DB PostgreSQL sur Render — credentials injectés automatiquement depuis `fromDatabase` dans `render.yaml` → SÉCURISÉ

**Ce qui est safe dans git (fichiers example) :**
- `.env.prod.example`, `backend/.env.example`, `backend/.env.e2e.example` — tous avec des placeholders uniquement

**Why:** GitHub secret scanning a flagué l'URL de production committée dans config.js.
**How to apply:** À chaque PR ou feature impliquant des URLs/configs de déploiement, vérifier que config.js n'est pas dans le staging. Le hook pre-commit le bloque maintenant automatiquement.
