# Administration — C'EMPIRE

> `backend/src/admin/` · Gestion utilisateurs · Super Admin

## Module Admin

### `AdminService` — `backend/src/admin/admin.service.ts`

| Méthode | Description |
|---------|-------------|
| `getAllUsers(page, limit, search, role, isActive)` | Liste paginée des utilisateurs avec filtres |
| `getUserById(id)` | Détail d'un utilisateur (sans mot de passe) |
| `updateUserRole(userId, newRole, adminId)` | Change le rôle d'un utilisateur |
| `updateUserStatus(userId, isActive)` | Active/désactive un compte |
| `createUser(dto)` | Crée un compte directement (admin) |

#### `updateUserRole(userId, newRole, adminId)`

```
Protection :
- Un admin ne peut pas se modifier lui-même
- Un admin ne peut pas créer un super_admin
- Seul un super_admin peut modifier les rôles admin
```

### Routes Admin (`/api/admin`)

| Méthode | Route | Rôle requis | Description |
|---------|-------|-------------|-------------|
| `GET` | `/api/admin/users` | admin, super_admin | Liste des utilisateurs |
| `GET` | `/api/admin/users/:id` | admin, super_admin | Détail utilisateur |
| `PATCH` | `/api/admin/users/:id/role` | super_admin | Changer le rôle |
| `PATCH` | `/api/admin/users/:id/status` | admin, super_admin | Activer/désactiver |
| `POST` | `/api/admin/users` | super_admin | Créer un utilisateur |

---

## Module Tasks (Missions)

### `TasksModule` — `backend/src/tasks/tasks.module.ts`

Gestion des missions assignées aux employés (C'Todo et autres services).

### Routes Tasks (`/api/tasks`)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/tasks` | Créer une mission |
| `GET` | `/api/tasks` | Toutes les missions (admin) |
| `GET` | `/api/tasks/my-tasks` | Mes missions (client) |
| `GET` | `/api/tasks/employee/:employeeId` | Missions d'un employé |
| `GET` | `/api/tasks/:id` | Détail d'une mission |
| `PATCH` | `/api/tasks/:id` | Modifier une mission |
| `DELETE` | `/api/tasks/:id` | Supprimer une mission |

---

## Modules de contenu

### `HighlightsModule` — Actualités & Campagnes

**Entités** : `NewsMessage`, `SeasonalCampaign`

**Routes** :
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/highlights/news` | Actualités publiées (public) |
| `GET` | `/api/highlights/campaigns` | Campagnes actives (public) |
| `POST` | `/api/highlights/news` | Créer une actualité (admin) |
| `PATCH` | `/api/highlights/news/:id` | Modifier (admin) |
| `POST` | `/api/highlights/campaigns` | Créer une campagne (admin) |
| `PATCH` | `/api/highlights/campaigns/:id` | Modifier (admin) |

### `SiteSettingsModule` — Configuration du site

Stockage clé-valeur pour la configuration globale (footer, SEO, contact, etc.).

**Routes** :
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/settings` | Configuration publique |
| `GET` | `/api/settings/:key` | Valeur d'une clé |
| `PUT` | `/api/settings/:key` | Mettre à jour une valeur (admin) |

### `SectorsModule` — Secteurs d'activité

**Routes** :
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/sectors` | Liste des secteurs |
| `POST` | `/api/sectors` | Créer un secteur (admin) |
| `PATCH` | `/api/sectors/:id` | Modifier (admin) |
| `DELETE` | `/api/sectors/:id` | Supprimer (admin) |

---

## Module Users

### `UserService` — `backend/src/users/users.service.ts`

Service partagé pour la gestion des profils utilisateurs.

| Méthode | Description |
|---------|-------------|
| `findAll()` | Liste tous les utilisateurs |
| `findOne(id)` | Trouve un utilisateur par ID |
| `findByEmail(email)` | Trouve par email |
| `update(id, dto)` | Met à jour le profil |
| `updateProfile(userId, dto)` | Met à jour le profil étendu |
| `getProfile(userId)` | Récupère le profil complet |
| `remove(id)` | Supprime un compte |
| `resetPassword(userId, newPassword)` | Reset admin du mot de passe |

### Routes Users (`/api/users` et `/api/profiles`)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/users/me` | Mon profil complet |
| `PATCH` | `/api/users/me` | Mettre à jour mon profil |
| `GET` | `/api/profiles/me` | Mon profil détaillé |
| `PATCH` | `/api/profiles/me` | Mettre à jour mon profil |
| `GET` | `/api/users` | Tous les utilisateurs (admin) |
