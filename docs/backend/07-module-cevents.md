# Module C'Events — Événements

> `backend/src/events/` · Événements · Réservations · IA

## Entités

### `Event`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `title` | string | Titre de l'événement |
| `description` | text | Description complète |
| `category` | enum | Catégorie de l'événement |
| `basePrice` | decimal | Tarif de participation |
| `isActive` | boolean | Événement visible |
| `images` | string[] | Images de l'événement |
| `startDate` | Date | Date de début |
| `endDate` | Date | Date de fin |
| `location` | string | Lieu |
| `maxParticipants` | number | Capacité maximale |
| `currentParticipants` | number | Inscriptions actuelles |

**`EventCategory`** :
```
CONFERENCE    → Conférences professionnelles
WORKSHOP      → Ateliers pratiques
SEMINAR       → Séminaires
NETWORKING    → Événements réseau
CONCERT       → Concerts & spectacles
SPORTS        → Événements sportifs
CULTURE       → Événements culturels
OTHER         → Autres
```

### `EventBooking`

Réservation d'un événement.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Participant |
| `eventId` | UUID | Événement réservé |
| `status` | enum | Statut de la réservation |
| `paymentId` | UUID (nullable) | Paiement lié |
| `options` | JSON (nullable) | Options choisies (places, etc.) |
| `totalAmount` | decimal | Montant total |
| `isPaid` | boolean | Payé |
| `notes` | text (nullable) | Notes |

**`EventBookingStatus`** :
```
PENDING   → En attente de paiement
CONFIRMED → Paiement reçu, place réservée
CANCELLED → Annulé
REFUSED   → Refusé par l'organisateur
```

---

## Services

### `EventService`

| Méthode | Description |
|---------|-------------|
| `findAll(filters?)` | Liste les événements actifs (avec filtres catégorie/date) |
| `findOne(id)` | Détail d'un événement |
| `create(dto)` | Crée un événement (admin) |
| `update(id, dto)` | Modifie un événement (admin) |
| `remove(id)` | Supprime un événement |
| `toggleActive(id)` | Active/désactive |

### `EventBookingService`

| Méthode | Description |
|---------|-------------|
| `createBooking(userId, dto)` | Crée une réservation + initie le paiement |
| `updateBooking(userId, id, dto)` | Modifie une réservation pending |
| `cancelBooking(userId, id)` | Annule une réservation |
| `validateBooking(id)` | Valide après paiement (admin) |
| `findByUser(userId)` | Réservations d'un participant |
| `findAll(filters)` | Toutes les réservations (admin) |
| `handlePaymentSuccess(event)` | `@OnEvent('payment.success')` |

### `EventAIService`

Suggestion de catégorie via IA pour les nouveaux événements.

```typescript
// POST /api/events/suggest-category
// Body: { need: "Je veux organiser un concert jazz" }
// Répond avec la catégorie suggérée : "CONCERT"
async suggestCategory(dto: SuggestCategoryDto): Promise<{ category: string }>
```

---

## Routes API

### Publiques
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/events` | Liste des événements actifs |
| `GET` | `/api/events/:id` | Détail d'un événement |
| `POST` | `/api/events/suggest-category` | Suggestion IA de catégorie |

### Client (JWT)
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/events/bookings` | Réserver un événement |
| `GET` | `/api/events/bookings/my` | Mes réservations |
| `PATCH` | `/api/events/bookings/:id` | Modifier une réservation |
| `DELETE` | `/api/events/bookings/:id` | Annuler une réservation |

### Admin
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/events` | Créer un événement |
| `PATCH` | `/api/events/:id` | Modifier un événement |
| `DELETE` | `/api/events/:id` | Supprimer un événement |
| `GET` | `/api/events/admin/bookings` | Toutes les réservations |
| `PATCH` | `/api/events/admin/bookings/:id/validate` | Valider une réservation |
