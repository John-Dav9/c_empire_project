# Module C'Grill — Restauration

> `backend/src/grill/` · Produits · Menus · Commandes · Livraison

## Entités

### `GrillProduct`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `title` | string | Nom du plat |
| `description` | text | Description du plat |
| `price` | decimal | Prix (XAF) |
| `promoPrice` | decimal (nullable) | Prix promotionnel |
| `category` | enum | `poisson` · `porc` · `poulet` · `menu` |
| `isAvailable` | boolean | Disponible à la commande |
| `isFeatured` | boolean | Mis en avant sur la page |
| `stockQty` | number | Stock disponible |
| `images` | string[] | URLs des images |
| `prepTimeMin` | number | Temps de préparation (minutes) |
| `tags` | string[] | Tags (ex: `['épicé', 'populaire']`) |

### `GrillOrder`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `fullName` | string | Nom du client |
| `email` | string | Email |
| `phone` | string | Téléphone |
| `deliveryMode` | enum | `PICKUP` ou `DELIVERY` |
| `address` | string (nullable) | Adresse (si DELIVERY) |
| `subtotal` | decimal | Montant articles |
| `deliveryFee` | decimal | Frais de livraison |
| `total` | decimal | Total à payer |
| `status` | enum | Statut de la commande |
| `paymentId` | UUID (nullable) | Référence paiement |
| `expressOrderId` | UUID (nullable) | Livraison C'Express associée |
| `isPaid` | boolean | Paiement reçu |

**`GrillOrderStatus`** :
```
PENDING      → Reçue, en attente de confirmation
CONFIRMED    → Confirmée par le restaurant
PREPARING    → En préparation en cuisine
READY        → Prête (pour pickup ou livraison)
PICKUP_DONE  → Client récupéré (pickup)
DELIVERED    → Livrée (delivery)
CANCELLED    → Annulée
```

**`GrillDeliveryMode`** :
```
PICKUP   → Client vient récupérer la commande
DELIVERY → Livraison à domicile via C'Express
```

### `GrillMenuPack`

Pack combiné de produits à prix fixe.

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `name` | string | Nom du pack |
| `description` | text | Description |
| `price` | decimal | Prix fixe du pack |
| `isActive` | boolean | Pack disponible |
| `items` | GrillMenuPackItem[] | Produits inclus |

### `GrillMenuPackItem`

Liaison entre un pack et ses produits.

| Colonne | Type | Description |
|---------|------|-------------|
| `packId` | UUID | Référence pack |
| `productId` | UUID | Référence produit |
| `quantity` | number | Quantité incluse dans le pack |

---

## Services

### `GrillOrdersService`

#### `create(dto: CreateGrillOrderDto): Promise<GrillOrder>`

```
1. Récupère les produits individuels commandés
2. Dépaquète les menu packs → liste de produits individuels
3. Pour chaque produit : vérifie la disponibilité et le stock
4. Décrémente les stocks
5. Calcule les frais de livraison :
   - PICKUP : 0 XAF
   - DELIVERY : tarif C'Express (quoteDelivery)
6. Crée la commande en base
7. Si DELIVERY : crée une livraison C'Express (expressOrderId)
8. Retourne la commande avec le total
```

#### `@OnEvent('payment.success')`
Marque la commande comme payée et notifie le restaurant.

#### `updateStatus(id, status)`
Change le statut de la commande (restaurant → admin).

### `GrillProductsService`

| Méthode | Description |
|---------|-------------|
| `findAll(filters?)` | Liste les produits disponibles |
| `findFeatured()` | Produits mis en avant |
| `findByCategory(category)` | Produits par catégorie |
| `create(dto)` | Crée un produit (admin) |
| `update(id, dto)` | Modifie un produit (admin) |
| `toggleAvailability(id)` | Active/désactive un produit |
| `updateStock(id, delta)` | Ajuste le stock |

### `GrillMenuPacksService`

| Méthode | Description |
|---------|-------------|
| `findAll()` | Liste les packs actifs |
| `create(dto)` | Crée un pack (admin) |
| `update(id, dto)` | Modifie un pack (admin) |
| `remove(id)` | Supprime un pack |

---

## Routes API

### Routes publiques

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/grill/products` | Liste des plats disponibles |
| `GET` | `/api/grill/products/:id` | Détail d'un plat |
| `GET` | `/api/grill/menu-packs` | Packs menus disponibles |

### Routes client (JWT)

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/grill/orders` | Passer une commande |
| `GET` | `/api/grill/orders/my` | Mes commandes grill |
| `GET` | `/api/grill/orders/:id` | Détail d'une commande |

### Routes admin

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/grill/orders` | Toutes les commandes |
| `PATCH` | `/api/grill/orders/:id/status` | Changer le statut |
| `POST` | `/api/grill/products` | Créer un produit |
| `PATCH` | `/api/grill/products/:id` | Modifier un produit |
| `DELETE` | `/api/grill/products/:id` | Supprimer un produit |
| `POST` | `/api/grill/menu-packs` | Créer un pack |
| `PATCH` | `/api/grill/menu-packs/:id` | Modifier un pack |

---

## DTO principal

### `CreateGrillOrderDto`

```typescript
class CreateGrillOrderDto {
  @IsString() fullName: string;
  @IsEmail() email: string;
  @IsString() phone: string;

  @IsEnum(GrillDeliveryMode)
  deliveryMode: GrillDeliveryMode;    // 'PICKUP' | 'DELIVERY'

  @ValidateIf(o => o.deliveryMode === 'DELIVERY')
  @IsString()
  address?: string;                    // Requis si DELIVERY

  @IsEnum(PaymentProvider)
  paymentProvider: PaymentProvider;   // 'stripe' | 'mtn_momo' | ...

  // Articles individuels
  @IsOptional()
  @IsArray()
  items?: { productId: string; quantity: number }[];

  // Packs menus
  @IsOptional()
  @IsArray()
  menuPacks?: { packId: string; quantity: number }[];
}
```
