# Référence API — C'EMPIRE

> Base URL dev : `http://localhost:3000/api`
> Base URL prod : `https://c-empire.onrender.com/api`

## Légende

| Symbole | Signification |
|---------|--------------|
| 🌍 | Route publique (pas de JWT requis) |
| 🔐 | JWT requis (tout utilisateur connecté) |
| 👤 | Client uniquement |
| 👷 | Employé uniquement |
| 👑 | Admin ou Super Admin |
| 🏆 | Super Admin uniquement |

---

## Authentification — `/api/auth`

| Méthode | Route | Accès | Corps / Params | Réponse |
|---------|-------|-------|----------------|---------|
| `POST` | `/auth/signup` | 🌍 | `{ email, password, firstname, lastname, phone? }` | `{ user, accessToken, refreshToken }` |
| `POST` | `/auth/signin` | 🌍 | `{ email, password }` | `{ user, accessToken, refreshToken }` |
| `GET` | `/auth/me` | 🔐 | — | `{ userId, email, role }` |
| `POST` | `/auth/refresh` | 🌍 | `{ refreshToken }` | `{ accessToken, refreshToken }` |
| `POST` | `/auth/forgot-password` | 🌍 | `{ email }` | `{ message, devResetUrl? }` |
| `GET` | `/auth/reset-password/validate` | 🌍 | `?token=...` | `{ valid: boolean }` |
| `POST` | `/auth/reset-password` | 🌍 | `{ token, newPassword }` | `{ message }` |

---

## Utilisateurs — `/api/users` & `/api/profiles`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/users/me` | 🔐 | Mon compte |
| `PATCH` | `/users/me` | 🔐 | Modifier mon compte |
| `GET` | `/profiles/me` | 🔐 | Mon profil complet |
| `PATCH` | `/profiles/me` | 🔐 | Modifier mon profil |
| `GET` | `/users` | 👑 | Tous les utilisateurs |
| `GET` | `/users/:id` | 👑 | Utilisateur par ID |

---

## C'Shop — `/api/cshop`

### Produits

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/cshop/products` | 🌍 | Liste produits (avec `?category=`, `?search=`, `?page=`) |
| `GET` | `/cshop/products/:id` | 🌍 | Détail produit |
| `POST` | `/cshop/products` | 👑 | Créer un produit |
| `PATCH` | `/cshop/products/:id` | 👑 | Modifier |
| `DELETE` | `/cshop/products/:id` | 👑 | Supprimer |

### Panier

| Méthode | Route | Accès | Corps | Description |
|---------|-------|-------|-------|-------------|
| `GET` | `/cshop/cart` | 🔐 | — | Mon panier |
| `POST` | `/cshop/cart/items` | 🔐 | `{ productId, quantity }` | Ajouter au panier |
| `PATCH` | `/cshop/cart/items/:id` | 🔐 | `{ quantity }` | Modifier quantité |
| `DELETE` | `/cshop/cart/items/:id` | 🔐 | — | Retirer article |

### Commandes

| Méthode | Route | Accès | Corps | Description |
|---------|-------|-------|-------|-------------|
| `POST` | `/cshop/orders/checkout` | 🔐 | `{ deliveryOption, deliveryAddress?, relayPointId?, promoCode? }` | Passer commande |
| `GET` | `/cshop/orders/my` | 🔐 | — | Mes commandes |
| `GET` | `/cshop/orders/:id` | 🔐 | — | Détail commande |
| `GET` | `/cshop/orders` | 👑 | — | Toutes les commandes |
| `PATCH` | `/cshop/orders/:id/status` | 👑 | `{ status }` | Changer statut |

### Promotions

| Méthode | Route | Accès | Corps | Description |
|---------|-------|-------|-------|-------------|
| `POST` | `/cshop/promos/validate` | 🔐 | `{ code, subtotal }` | Valider un code promo |
| `POST` | `/cshop/promos` | 👑 | `{ code, type, value, ... }` | Créer promo |
| `PATCH` | `/cshop/promos/:id` | 👑 | | Modifier |
| `DELETE` | `/cshop/promos/:id` | 👑 | | Supprimer |

### Points Relais

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/cshop/relay-points` | 🌍 | Points relais actifs |
| `POST` | `/cshop/relay-points` | 👑 | Créer un point relais |
| `PATCH` | `/cshop/relay-points/:id` | 👑 | Modifier |
| `DELETE` | `/cshop/relay-points/:id` | 👑 | Supprimer |

### Avis

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/cshop/products/:id/reviews` | 🌍 | Avis approuvés d'un produit |
| `POST` | `/cshop/reviews` | 🔐 | Publier un avis |
| `PATCH` | `/cshop/reviews/:id/approve` | 👑 | Approuver un avis |
| `DELETE` | `/cshop/reviews/:id` | 👑 | Supprimer un avis |

---

## C'Grill — `/api/grill`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/grill/products` | 🌍 | Plats disponibles |
| `GET` | `/grill/products/:id` | 🌍 | Détail d'un plat |
| `POST` | `/grill/products` | 👑 | Créer un plat |
| `PATCH` | `/grill/products/:id` | 👑 | Modifier |
| `DELETE` | `/grill/products/:id` | 👑 | Supprimer |
| `GET` | `/grill/menu-packs` | 🌍 | Packs menus |
| `POST` | `/grill/menu-packs` | 👑 | Créer un pack |
| `POST` | `/grill/orders` | 🔐 | Passer une commande |
| `GET` | `/grill/orders/my` | 🔐 | Mes commandes grill |
| `GET` | `/grill/orders` | 👑 | Toutes les commandes |
| `PATCH` | `/grill/orders/:id/status` | 👑 | Changer statut |

---

## C'Express — `/api/express`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `POST` | `/express/quote` | 🌍 | Calculer un devis |
| `POST` | `/express/deliveries` | 🔐 | Créer une livraison |
| `GET` | `/express/deliveries/my` | 🔐 | Mes livraisons |
| `GET` | `/express/deliveries/:id` | 🔐 | Détail |
| `GET` | `/express/admin/deliveries` | 👑 | Toutes les livraisons |
| `PATCH` | `/express/admin/deliveries/:id/assign` | 👑 | Assigner coursier |
| `PATCH` | `/express/admin/deliveries/:id/status` | 👑 | Changer statut |
| `GET` | `/express/admin/couriers` | 👑 | Tous les coursiers |
| `POST` | `/express/admin/couriers` | 👑 | Créer un coursier |
| `POST` | `/express/import-export` | 🔐 | Créer un dossier I/E |
| `GET` | `/express/import-export/my` | 🔐 | Mes dossiers I/E |
| `GET` | `/express/admin/import-export` | 👑 | Tous les dossiers I/E |
| `PATCH` | `/express/admin/import-export/:id/price` | 👑 | Définir le prix |

---

## C'Clean — `/api/clean`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/clean/services` | 🌍 | Services disponibles |
| `POST` | `/clean/bookings` | 🔐 | Créer une réservation |
| `GET` | `/clean/bookings/my` | 🔐 | Mes réservations |
| `GET` | `/clean/bookings/:id` | 🔐 | Détail |
| `GET` | `/clean/admin/bookings` | 👑 | Toutes les réservations |
| `PATCH` | `/clean/admin/bookings/:id/status` | 👑 | Changer statut |
| `POST` | `/clean/admin/quotes` | 👑 | Créer un devis |
| `POST` | `/clean/admin/services` | 👑 | Créer un service |
| `PATCH` | `/clean/admin/services/:id` | 👑 | Modifier un service |

---

## C'Events — `/api/events`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/events` | 🌍 | Événements actifs |
| `GET` | `/events/:id` | 🌍 | Détail d'un événement |
| `POST` | `/events/suggest-category` | 🌍 | Suggestion IA de catégorie |
| `POST` | `/events/bookings` | 🔐 | Réserver un événement |
| `GET` | `/events/bookings/my` | 🔐 | Mes réservations |
| `PATCH` | `/events/bookings/:id` | 🔐 | Modifier une réservation |
| `DELETE` | `/events/bookings/:id` | 🔐 | Annuler |
| `POST` | `/events` | 👑 | Créer un événement |
| `PATCH` | `/events/:id` | 👑 | Modifier |
| `DELETE` | `/events/:id` | 👑 | Supprimer |
| `GET` | `/events/admin/bookings` | 👑 | Toutes les réservations |
| `PATCH` | `/events/admin/bookings/:id/validate` | 👑 | Valider |

---

## C'Todo — `/api/todo`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/todo/services` | 🌍 | Services disponibles |
| `POST` | `/todo/orders` | 🔐 | Commander un service |
| `GET` | `/todo/orders/my` | 🔐 | Mes commandes |
| `GET` | `/todo/admin/orders` | 👑 | Toutes les commandes |
| `PATCH` | `/todo/admin/orders/:id/assign` | 👑 | Assigner employé |
| `POST` | `/todo/admin/services` | 👑 | Créer un service |

---

## Tasks — `/api/tasks`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `POST` | `/tasks` | 👑 | Créer une mission |
| `GET` | `/tasks` | 👑 | Toutes les missions |
| `GET` | `/tasks/my-tasks` | 🔐 | Mes missions |
| `GET` | `/tasks/employee/:id` | 👑 | Missions d'un employé |
| `GET` | `/tasks/:id` | 🔐 | Détail |
| `PATCH` | `/tasks/:id` | 🔐 | Modifier |
| `DELETE` | `/tasks/:id` | 👑 | Supprimer |

---

## Paiements — `/api/payments`

| Méthode | Route | Accès | Corps | Description |
|---------|-------|-------|-------|-------------|
| `POST` | `/payments/init` | 🔐 | `{ provider, amount, currency, referenceType, referenceId }` | Initier un paiement |
| `GET` | `/payments/:id` | 🔐 | — | Infos d'un paiement |
| `POST` | `/payments/webhook/stripe` | 🌍 | Payload Stripe | Webhook Stripe |
| `POST` | `/payments/webhook/mtn_momo` | 🌍 | Payload MTN | Webhook MTN |
| `POST` | `/payments/webhook/orange_money` | 🌍 | Payload Orange | Webhook Orange |

---

## Administration — `/api/admin`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/admin/users` | 👑 | Tous les utilisateurs (paginé) |
| `GET` | `/admin/users/:id` | 👑 | Détail utilisateur |
| `PATCH` | `/admin/users/:id/role` | 🏆 | Changer le rôle |
| `PATCH` | `/admin/users/:id/status` | 👑 | Activer/désactiver |
| `POST` | `/admin/users` | 🏆 | Créer un utilisateur |

---

## Marketing & Settings — `/api/settings` & `/api/highlights`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/highlights/news` | 🌍 | Actualités publiées |
| `GET` | `/highlights/campaigns` | 🌍 | Campagnes actives |
| `POST` | `/highlights/news` | 👑 | Créer actualité |
| `POST` | `/highlights/campaigns` | 👑 | Créer campagne |
| `GET` | `/settings` | 🌍 | Config publique |
| `GET` | `/settings/:key` | 🌍 | Valeur d'une clé |
| `PUT` | `/settings/:key` | 👑 | Modifier config |
| `GET` | `/settings/content-pages/:slug` | 🌍 | Page CMS par slug |

---

## Secteurs — `/api/sectors`

| Méthode | Route | Accès | Description |
|---------|-------|-------|-------------|
| `GET` | `/sectors` | 🌍 | Liste des secteurs |
| `POST` | `/sectors` | 🏆 | Créer |
| `PATCH` | `/sectors/:id` | 🏆 | Modifier |
| `DELETE` | `/sectors/:id` | 🏆 | Supprimer |

---

## Health Check — `/api/health`

| Méthode | Route | Accès | Réponse |
|---------|-------|-------|---------|
| `GET` | `/health` | 🌍 | `{ status: 'ok', timestamp: '...' }` |

Utilisé par Render pour vérifier que le serveur est opérationnel.

---

## Codes d'erreur standard

```json
// 400 Bad Request (validation DTO)
{
  "statusCode": 400,
  "message": ["email must be an email", "password should not be empty"],
  "error": "Bad Request"
}

// 401 Unauthorized
{ "statusCode": 401, "message": "Unauthorized" }

// 403 Forbidden
{ "statusCode": 403, "message": "Forbidden resource" }

// 404 Not Found
{ "statusCode": 404, "message": "Ressource non trouvée" }

// 409 Conflict
{ "statusCode": 409, "message": "Cet email est déjà utilisé" }

// 429 Too Many Requests
{ "statusCode": 429, "message": "Too Many Requests" }

// 500 Internal Server Error
{ "statusCode": 500, "message": "Internal server error" }
```

---

## Documentation Swagger

En développement, la documentation interactive Swagger est disponible sur :
```
http://localhost:3000/api/docs
```

Elle permet de tester toutes les routes directement depuis le navigateur avec authentification JWT.
