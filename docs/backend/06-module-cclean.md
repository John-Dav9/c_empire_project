# Module C'Clean — Services de Nettoyage

> `backend/src/clean/` · Services · Réservations · Devis · Avis

## Entités

### `CleanService`

Catalogue des types de services proposés.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `title` | string | Nom du service (ex: "Nettoyage bureau") |
| `description` | text | Description détaillée |
| `basePrice` | decimal | Tarif de base (XAF) |
| `unit` | string | Unité tarifaire (ex: "par m²", "par heure") |
| `images` | string[] | Photos du service |
| `isActive` | boolean | Service proposé actuellement |
| `serviceType` | enum | Type de nettoyage |

### `CleanBooking`

Réservation d'un service de nettoyage.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Client |
| `fullName` | string | Nom complet du client |
| `email` | string | Email |
| `phone` | string | Téléphone |
| `cleanServiceId` | UUID | Service demandé |
| `serviceTitle` | string | Snapshot du nom du service |
| `amount` | decimal | Montant à payer |
| `currency` | string | Devise |
| `address` | string | Adresse du lieu à nettoyer |
| `city` | string | Ville |
| `scheduledAt` | Date | Date et heure prévues |
| `status` | enum | Statut de la réservation |
| `paymentId` | UUID (nullable) | Référence paiement |
| `assignedTo` | UUID (nullable) | Nettoyeur assigné |
| `notes` | text (nullable) | Instructions particulières |
| `quoteId` | UUID (nullable) | Devis associé |

**`CleanBookingStatus`** :
```
DRAFT              → Brouillon (avant paiement)
QUOTE_REQUESTED    → Devis demandé
QUOTE_PROVIDED     → Devis fourni, en attente d'acceptation
CONFIRMED          → Paiement reçu, réservation confirmée
IN_PROGRESS        → Nettoyage en cours
COMPLETED          → Terminé
CANCELLED          → Annulé
```

### `CleanQuote`

Devis envoyé avant la réservation.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `bookingId` | UUID | Réservation associée |
| `estimatedPrice` | decimal | Prix estimé |
| `details` | text | Détails du devis |
| `validUntil` | Date | Validité du devis |
| `status` | enum | `PENDING` · `ACCEPTED` · `REJECTED` |

### `CleanReview`

Avis client après un service.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `bookingId` | UUID | Réservation concernée |
| `userId` | UUID | Client |
| `rating` | number | Note 1-5 |
| `comment` | text | Commentaire |
| `isApproved` | boolean | Approuvé par admin |

---

## Services

### `CleanBookingsService`

| Méthode | Description |
|---------|-------------|
| `create(userId, dto)` | Crée une réservation en statut `DRAFT` |
| `updateStatus(id, dto)` | Change le statut + assigne un nettoyeur |
| `findByUser(userId)` | Réservations d'un client |
| `findAll(filters)` | Toutes les réservations (admin) |
| `findOne(id)` | Détail d'une réservation |
| `handlePaymentSuccess(event)` | `@OnEvent('payment.success')` → statut `CONFIRMED` |

### `CleanServicesService`

| Méthode | Description |
|---------|-------------|
| `findAll()` | Liste les services actifs (public) |
| `findAllAdmin()` | Tous les services (admin) |
| `create(dto)` | Crée un service (admin) |
| `update(id, dto)` | Modifie un service (admin) |
| `setActive(id, isActive)` | Active/désactive |
| `remove(id)` | Supprime un service |

### `CleanQuotesService`

| Méthode | Description |
|---------|-------------|
| `createQuote(bookingId, dto)` | Génère un devis pour une réservation |
| `acceptQuote(quoteId)` | Client accepte le devis |
| `rejectQuote(quoteId)` | Client refuse le devis |
| `findByBooking(bookingId)` | Devis d'une réservation |

### `CleanReviewsService`

| Méthode | Description |
|---------|-------------|
| `create(userId, dto)` | Crée un avis |
| `findByService(serviceId)` | Avis d'un service |
| `approve(id)` | Approuve un avis (admin) |

---

## Routes API

### Publiques
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/clean/services` | Services disponibles |
| `GET` | `/api/clean/services/:id` | Détail d'un service |

### Client (JWT)
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/clean/bookings` | Créer une réservation |
| `GET` | `/api/clean/bookings/my` | Mes réservations |
| `GET` | `/api/clean/bookings/:id` | Détail d'une réservation |
| `POST` | `/api/clean/quotes/:quoteId/accept` | Accepter un devis |
| `POST` | `/api/clean/reviews` | Laisser un avis |

### Admin
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/clean/admin/bookings` | Toutes les réservations |
| `PATCH` | `/api/clean/admin/bookings/:id/status` | Changer le statut |
| `PATCH` | `/api/clean/admin/bookings/:id/assign` | Assigner un nettoyeur |
| `POST` | `/api/clean/admin/quotes` | Créer un devis |
| `POST` | `/api/clean/admin/services` | Créer un service |
| `PATCH` | `/api/clean/admin/services/:id` | Modifier un service |
