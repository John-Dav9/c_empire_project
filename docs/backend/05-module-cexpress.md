# Module C'Express — Livraison & Import/Export

> `backend/src/express/` · Livraisons · Coursiers · Import/Export

## Entités

### `Delivery`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Client demandeur |
| `pickupAddress` | string | Adresse de collecte |
| `deliveryAddress` | string | Adresse de livraison |
| `pickupLat/Lng` | decimal | Coordonnées collecte |
| `deliveryLat/Lng` | decimal | Coordonnées livraison |
| `packageType` | string | Type de colis (document, petit, moyen, lourd) |
| `weightKg` | decimal | Poids en kg |
| `distanceKm` | decimal | Distance calculée en km |
| `urgencyLevel` | string | `standard` · `express` · `urgent` |
| `price` | decimal | Prix calculé (XAF) |
| `paid` | boolean | Paiement reçu |
| `courierId` | UUID (nullable) | Coursier assigné |
| `status` | enum | Statut de la livraison |
| `notes` | text (nullable) | Notes spéciales |
| `estimatedDeliveryAt` | Date (nullable) | Heure estimée de livraison |

**`DeliveryStatus`** :
```
PENDING    → Demande reçue
QUOTED     → Devis calculé, en attente de paiement
ASSIGNED   → Coursier assigné
PICKED     → Colis collecté
DELIVERED  → Livré
CANCELLED  → Annulé
```

### `Courier`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Compte utilisateur lié |
| `vehicleType` | string | `moto` · `vélo` · `voiture` |
| `isAvailable` | boolean | Disponible pour missions |
| `currentLat/Lng` | decimal | Position GPS actuelle |
| `rating` | decimal | Note moyenne |
| `completedDeliveries` | number | Nb de livraisons effectuées |

### `ImportExport`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Client |
| `direction` | enum | `IMPORT` ou `EXPORT` |
| `originCountry` | string | Pays d'origine |
| `destinationCountry` | string | Pays de destination |
| `description` | text | Description des marchandises |
| `weightKg` | decimal | Poids total |
| `estimatedValue` | decimal | Valeur estimée |
| `status` | enum | Statut du dossier |
| `price` | decimal | Prix calculé |

---

## Services

### `DeliveryService`

| Méthode | Description |
|---------|-------------|
| `quoteDelivery(pickup, delivery, weight)` | Calcule le prix d'une livraison |
| `create(userId, dto)` | Crée une demande de livraison |
| `assignCourier(deliveryId, courierId)` | Assigne un coursier |
| `updateStatus(id, status)` | Met à jour le statut |
| `findByUser(userId)` | Livraisons d'un client |
| `findAll(filters)` | Toutes les livraisons (admin) |
| `findAvailableCouriers()` | Coursiers disponibles |

#### `quoteDelivery(payload)` — Calcul de prix

```
Algorithme de tarification :
1. Calcule la distance entre pickup et delivery (via coordonnées GPS ou API)
2. Prix de base = f(distance, weightKg)
3. Majoration urgencyLevel :
   - standard : ×1.0
   - express  : ×1.3
   - urgent   : ×1.6
4. Retourne { price, distanceKm, estimatedMinutes }
```

### `CourierService`

| Méthode | Description |
|---------|-------------|
| `create(dto)` | Crée un profil coursier |
| `findAll()` | Liste tous les coursiers |
| `findAvailable()` | Coursiers disponibles |
| `updateLocation(courierId, lat, lng)` | Met à jour la position GPS |
| `setAvailable(courierId, isAvailable)` | Disponibilité |
| `updateRating(courierId, rating)` | Met à jour la note |

### `ImportExportService`

| Méthode | Description |
|---------|-------------|
| `create(userId, dto)` | Crée un dossier import/export |
| `findByUser(userId)` | Dossiers d'un client |
| `findAll()` | Tous les dossiers (admin) |
| `updateStatus(id, status)` | Change le statut (admin) |
| `setPrice(id, price)` | Définit le prix (admin) |

---

## Routes API

### Routes publiques
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/express/quote` | Obtenir un devis de livraison |

### Routes client (JWT)
| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/express/deliveries` | Créer une livraison |
| `GET` | `/api/express/deliveries/my` | Mes livraisons |
| `GET` | `/api/express/deliveries/:id` | Détail d'une livraison |
| `POST` | `/api/express/import-export` | Créer un dossier I/E |
| `GET` | `/api/express/import-export/my` | Mes dossiers I/E |

### Routes admin
| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/express/admin/deliveries` | Toutes les livraisons |
| `PATCH` | `/api/express/admin/deliveries/:id/assign` | Assigner un coursier |
| `PATCH` | `/api/express/admin/deliveries/:id/status` | Changer le statut |
| `GET` | `/api/express/admin/couriers` | Tous les coursiers |
| `POST` | `/api/express/admin/couriers` | Créer un coursier |
| `GET` | `/api/express/admin/import-export` | Tous les dossiers I/E |
| `PATCH` | `/api/express/admin/import-export/:id/price` | Définir le prix |
