# Module C'Todo — Services à la Demande

> `backend/src/todo/` · Bricolage · Coursier · Petits travaux

## Entités

### `TodoService`

Catalogue des services proposés.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `title` | string | Nom du service (ex: "Pose d'étagères") |
| `description` | text | Description détaillée |
| `basePrice` | decimal | Tarif de base |
| `priceUnit` | string | Unité (ex: "par heure", "forfait") |
| `category` | string | Catégorie (plomberie, électricité, etc.) |
| `isActive` | boolean | Service disponible |
| `images` | string[] | Photos illustratives |
| `estimatedDurationMin` | number | Durée estimée en minutes |

### `TodoOrder`

Commande d'un service à la demande.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Client |
| `serviceId` | UUID | Service commandé |
| `serviceTitle` | string | Snapshot titre |
| `address` | string | Adresse d'intervention |
| `scheduledAt` | Date | Date et heure souhaitées |
| `status` | enum | Statut de la commande |
| `amount` | decimal | Montant |
| `isPaid` | boolean | Payé |
| `assignedEmployeeId` | UUID (nullable) | Employé assigné |
| `notes` | text (nullable) | Instructions |

---

## Services

### `TodoOrderService`

| Méthode | Description |
|---------|-------------|
| `create(userId, dto)` | Crée une commande de service |
| `findByUser(userId)` | Commandes d'un client |
| `findByEmployee(employeeId)` | Missions d'un employé |
| `findAll(filters)` | Toutes les commandes (admin) |
| `updateStatus(id, status)` | Change le statut |
| `assignEmployee(id, employeeId)` | Assigne un employé |
| `handlePaymentSuccess(event)` | `@OnEvent('payment.success')` |

### `TodoServicesService`

| Méthode | Description |
|---------|-------------|
| `findAll()` | Services disponibles (public) |
| `findByCategory(category)` | Filtrage par catégorie |
| `create(dto)` | Crée un service (admin) |
| `update(id, dto)` | Modifie un service (admin) |
| `setActive(id, isActive)` | Active/désactive |
| `remove(id)` | Supprime un service |

### `TodoSuggestionService`

Suggestions de services via IA basée sur la description du besoin.

### `TodoStatsService`

Statistiques des commandes (pour le dashboard admin).

---

## Routes API

### Publiques
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/todo/services` | Liste des services disponibles |
| `GET` | `/api/todo/services/:id` | Détail d'un service |

### Client (JWT)
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/todo/orders` | Commander un service |
| `GET` | `/api/todo/orders/my` | Mes commandes |
| `GET` | `/api/todo/orders/:id` | Détail d'une commande |

### Employé (JWT + role employee)
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/tasks/employee/:employeeId` | Mes missions assignées |
| `PATCH` | `/api/tasks/:id` | Mettre à jour le statut d'une mission |

### Admin
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/todo/admin/orders` | Toutes les commandes |
| `PATCH` | `/api/todo/admin/orders/:id/assign` | Assigner un employé |
| `PATCH` | `/api/todo/admin/orders/:id/status` | Changer le statut |
| `POST` | `/api/todo/admin/services` | Créer un service |
| `PATCH` | `/api/todo/admin/services/:id` | Modifier un service |
