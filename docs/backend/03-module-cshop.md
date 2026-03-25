# Module C'Shop — E-commerce

> `backend/src/shop/` · Produits · Panier · Commandes · Livraison · Promotions

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Entités](#entités)
3. [Services](#services)
4. [Contrôleurs & Routes](#contrôleurs--routes)
5. [DTOs](#dtos)
6. [Flux de commande complet](#flux-de-commande-complet)
7. [Modes de livraison](#modes-de-livraison)
8. [Promotions](#promotions)

---

## Vue d'ensemble

C'Shop est le module e-commerce de la plateforme. Il gère :
- Le **catalogue de produits** (CRUD, images, stock)
- Les **paniers** (ajout/suppression d'articles, persistance)
- Les **commandes** (création, paiement, suivi de statut)
- Les **modes de livraison** (express, gratuit, point relais, entrepôt)
- Les **codes promo** (réduction fixe ou pourcentage)
- Les **avis produits** (notation, commentaires)
- Les **points relais** (boutiques partenaires)

---

## Entités

### `Product` — `shop/product/product.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `name` | string | Nom du produit |
| `description` | text | Description complète |
| `price` | decimal | Prix unitaire (XAF) |
| `stock` | number | Quantité disponible en stock |
| `images` | string[] | URLs des images (tableau) |
| `category` | string | Catégorie du produit |
| `sku` | string | Référence unique produit |
| `isActive` | boolean | Produit visible en boutique |
| `ratings` | number | Note moyenne (0-5) |
| `reviewCount` | number | Nombre d'avis |
| `createdAt` | Date | Date d'ajout |
| `updatedAt` | Date | Dernière modification |

### `Cart` — `shop/cart/cart.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Propriétaire du panier |
| `isActive` | boolean | Panier actif (un seul par user) |
| `items` | CartItem[] | Relation OneToMany |
| `createdAt` | Date | Date de création |

### `CartItem` — `shop/cart/cart-item.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `cartId` | UUID | Référence vers cart |
| `productId` | UUID | Référence vers product |
| `quantity` | number | Quantité souhaitée |

### `Order` — `shop/order/order.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Client ayant passé la commande |
| `items` | OrderItem[] | Lignes de commande |
| `totalAmount` | decimal | Montant total (articles + livraison) |
| `subtotal` | decimal | Montant articles seuls |
| `deliveryFee` | decimal | Frais de livraison |
| `promoCode` | string (nullable) | Code promo utilisé |
| `promoDiscount` | decimal | Montant de la remise |
| `status` | enum | Statut de la commande |
| `deliveryOption` | enum | Mode de livraison |
| `deliveryAddress` | string (nullable) | Adresse de livraison |
| `relayPointId` | string (nullable) | ID du point relais choisi |
| `isPaid` | boolean | Paiement reçu |
| `paymentId` | UUID (nullable) | Référence au paiement |
| `deliveryStatus` | string | Statut de la livraison |
| `createdAt` | Date | Date de commande |

**`OrderStatus` enum** :
```typescript
PENDING    = 'pending'     // En attente de paiement
PROCESSING = 'processing'  // Paiement reçu, en préparation
SHIPPED    = 'shipped'     // Expédié
DELIVERED  = 'delivered'   // Livré
CANCELLED  = 'cancelled'   // Annulé
```

**`DeliveryOption` enum** :
```typescript
CEXPRESS  = 'cexpress'   // Livraison par C'Express (~7500 XAF)
FREE      = 'free'       // Livraison gratuite offerte
RELAY     = 'relay'      // Retrait dans un point relais
WAREHOUSE = 'warehouse'  // Retrait en entrepôt C'EMPIRE
```

### `OrderItem` — `shop/order/order-item.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `orderId` | UUID | Référence vers order |
| `productId` | UUID | Référence vers product |
| `quantity` | number | Quantité commandée |
| `unitPrice` | decimal | Prix unitaire au moment de la commande |
| `linePrice` | decimal | `unitPrice × quantity` |
| `productName` | string | Snapshot du nom produit |

### `Promotion` — `shop/promotion/promotion.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `code` | string | Code unique (ex: `PROMO20`) |
| `type` | enum | `PERCENT` ou `FIXED` |
| `value` | decimal | Valeur de la remise |
| `minOrderAmount` | decimal | Montant minimum pour utiliser le code |
| `maxUses` | number | Utilisations maximum totales |
| `usedCount` | number | Nombre d'utilisations actuelles |
| `expiresAt` | Date | Date d'expiration |
| `isActive` | boolean | Promotion active |

### `RelayPoint` — `shop/relay-point/relay-point.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `name` | string | Nom du point relais |
| `address` | string | Adresse complète |
| `city` | string | Ville |
| `phone` | string | Téléphone de contact |
| `openingHours` | string | Horaires d'ouverture |
| `lat` | decimal (nullable) | Latitude GPS |
| `lng` | decimal (nullable) | Longitude GPS |
| `isActive` | boolean | Point actif |
| `note` | string (nullable) | Note interne |

### `Review` — `shop/review/review.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `productId` | UUID | Produit évalué |
| `userId` | UUID | Auteur de l'avis |
| `rating` | number | Note de 1 à 5 |
| `comment` | text | Commentaire |
| `isApproved` | boolean | Avis validé par admin |

---

## Services

### `ProductService` — `shop/product/product.service.ts`

| Méthode | Description |
|---------|-------------|
| `findAll(filters?)` | Liste les produits actifs avec filtres (catégorie, recherche, pagination) |
| `findOne(id)` | Récupère un produit par ID |
| `create(dto)` | Crée un produit (admin) |
| `update(id, dto)` | Met à jour un produit (admin) |
| `remove(id)` | Supprime un produit (admin) |
| `updateStock(id, delta)` | Décrémente ou incrémente le stock |

### `CartService` — `shop/cart/cart.service.ts`

| Méthode | Description |
|---------|-------------|
| `getCart(userId)` | Récupère le panier actif de l'utilisateur (ou le crée) |
| `addItem(userId, productId, quantity)` | Ajoute un article ou augmente la quantité |
| `updateItem(userId, cartItemId, quantity)` | Change la quantité d'un article |
| `removeItem(userId, cartItemId)` | Retire un article du panier |
| `clearCart(userId)` | Vide le panier |
| `getCartTotal(userId)` | Calcule le total du panier |

### `OrderService` — `shop/order/order.service.ts`

Méthode principale : **`checkout(userId, payload)`**

```
checkout(userId: string, payload: CreateOrderDto): Promise<Order>

Étapes :
1. Charge le panier de l'utilisateur
2. Vérifie que le panier n'est pas vide
3. Pour chaque article :
   - Vérifie que le produit existe et est actif
   - Vérifie que le stock est suffisant
   - Décrémente le stock
4. Valide le code promo si fourni :
   - Vérifie que le code existe et est actif
   - Vérifie que la date n'est pas dépassée
   - Vérifie le nombre max d'utilisations
   - Vérifie le montant minimum de commande
   - Calcule la remise (PERCENT ou FIXED)
5. Calcule les frais de livraison selon le mode :
   - CEXPRESS : appelle CexpressService.quoteDelivery() → tarif dynamique
   - RELAY    : vérifie que le relayPointId existe et est actif → 0 XAF
   - FREE     : 0 XAF
   - WAREHOUSE: 0 XAF
6. Crée la commande en base avec status = PENDING
7. Vide le panier
8. Retourne la commande créée (avec orderId pour déclencher le paiement)
```

#### `handlePaymentSuccess(event: PaymentSuccessEvent)`

Écoute l'événement `payment.success` (déclenché par PaymentsModule) :

```typescript
@OnEvent('payment.success')
async handlePaymentSuccess(event: PaymentSuccessEvent) {
  // Trouve la commande correspondante
  const order = await this.findByPaymentReference(event.referenceId);

  // Marque la commande comme payée
  order.isPaid = true;
  order.paymentId = event.paymentId;
  order.status = OrderStatus.PROCESSING;

  await this.orderRepository.save(order);
  // → Notification envoyée au client
}
```

#### Autres méthodes `OrderService`

| Méthode | Description |
|---------|-------------|
| `findAll(filters)` | Liste toutes les commandes (admin) avec pagination |
| `findByUser(userId)` | Commandes d'un utilisateur |
| `findOne(id)` | Détail d'une commande |
| `updateStatus(id, status)` | Change le statut (admin) |
| `cancelOrder(id)` | Annule une commande et restore le stock |

### `PromotionService` — `shop/promotion/promotion.service.ts`

| Méthode | Description |
|---------|-------------|
| `validateCode(code, subtotal)` | Vérifie et retourne la promotion valide |
| `applyCode(promotionId)` | Incrémente le compteur d'utilisations |
| `create(dto)` | Crée une promotion (admin) |
| `findAll()` | Liste toutes les promotions (admin) |
| `update(id, dto)` | Modifie une promotion (admin) |
| `remove(id)` | Supprime une promotion (admin) |

### `RelayPointService` — `shop/relay-point/relay-point.service.ts`

| Méthode | Description |
|---------|-------------|
| `findAll()` | Liste les points relais actifs (public) |
| `findAllAdmin()` | Liste tous les points relais (admin) |
| `findOne(id)` | Récupère un point relais par ID |
| `create(dto)` | Crée un point relais (admin) |
| `update(id, dto)` | Modifie un point relais (admin) |
| `setActive(id, isActive)` | Active/désactive un point relais |
| `remove(id)` | Supprime un point relais |

### `ReviewService` — `shop/review/review.service.ts`

| Méthode | Description |
|---------|-------------|
| `create(userId, dto)` | Crée un avis produit |
| `findByProduct(productId)` | Récupère les avis approuvés d'un produit |
| `approve(id)` | Approuve un avis (admin) |
| `remove(id)` | Supprime un avis (admin) |

---

## Contrôleurs & Routes

### Routes publiques (pas de JWT requis)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/cshop/products` | Liste des produits actifs |
| `GET` | `/api/cshop/products/:id` | Détail d'un produit |
| `GET` | `/api/cshop/products/:id/reviews` | Avis d'un produit |
| `GET` | `/api/cshop/relay-points` | Liste des points relais actifs |

### Routes client (JWT requis)

| Méthode | Route | Description |
|---------|-------|-------------|
| `GET` | `/api/cshop/cart` | Mon panier |
| `POST` | `/api/cshop/cart/items` | Ajouter au panier |
| `PATCH` | `/api/cshop/cart/items/:id` | Modifier quantité |
| `DELETE` | `/api/cshop/cart/items/:id` | Retirer du panier |
| `POST` | `/api/cshop/orders/checkout` | Passer commande |
| `GET` | `/api/cshop/orders/my` | Mes commandes |
| `GET` | `/api/cshop/orders/:id` | Détail d'une commande |
| `POST` | `/api/cshop/promos/validate` | Valider un code promo |
| `POST` | `/api/cshop/reviews` | Publier un avis |

### Routes admin

| Méthode | Route | Description |
|---------|-------|-------------|
| `POST` | `/api/cshop/products` | Créer un produit |
| `PATCH` | `/api/cshop/products/:id` | Modifier un produit |
| `DELETE` | `/api/cshop/products/:id` | Supprimer un produit |
| `GET` | `/api/cshop/orders` | Toutes les commandes |
| `PATCH` | `/api/cshop/orders/:id/status` | Changer statut commande |
| `POST` | `/api/cshop/promos` | Créer un code promo |
| `PATCH` | `/api/cshop/promos/:id` | Modifier un code promo |
| `DELETE` | `/api/cshop/promos/:id` | Supprimer un code promo |
| `POST` | `/api/cshop/relay-points` | Créer un point relais |
| `PATCH` | `/api/cshop/relay-points/:id` | Modifier un point relais |
| `DELETE` | `/api/cshop/relay-points/:id` | Supprimer un point relais |
| `GET` | `/api/cshop/reviews` | Tous les avis |
| `PATCH` | `/api/cshop/reviews/:id/approve` | Approuver un avis |

---

## DTOs

### `CreateOrderDto`

```typescript
class CreateOrderDto {
  @IsEnum(DeliveryOption)
  deliveryOption: DeliveryOption;   // 'cexpress' | 'free' | 'relay' | 'warehouse'

  @ValidateIf(o => o.deliveryOption === DeliveryOption.CEXPRESS)
  @IsString()
  @IsNotEmpty()
  deliveryAddress?: string;          // Requis seulement pour CEXPRESS

  @ValidateIf(o => o.deliveryOption === DeliveryOption.RELAY)
  @IsUUID('4')
  relayPointId?: string;             // Requis seulement pour RELAY

  @IsOptional()
  @IsString()
  promoCode?: string;                // Code promo optionnel
}
```

### `AddToCartDto`

```typescript
class AddToCartDto {
  @IsUUID('4')
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;
}
```

---

## Flux de commande complet

```
Client                    Frontend                    Backend                    BDD
  │                          │                           │                        │
  ├─ Navigue /shop ─────────►│                           │                        │
  │                          ├─ GET /cshop/products ────►│ findAll()              │
  │                          │◄──── liste produits ───────┤                       │
  │                          │                           │                        │
  ├─ Ajoute au panier ──────►│                           │                        │
  │                          ├─ POST /cshop/cart/items ─►│ addItem()              │
  │                          │   { productId, quantity } │ INSERT cart_items      │
  │                          │◄──── { cart } ────────────┤                        │
  │                          │                           │                        │
  ├─ Saisit code promo ─────►│                           │                        │
  │                          ├─ POST /cshop/promos/validate ► validateCode()      │
  │                          │◄──── { discount: 2000 } ──┤                        │
  │                          │                           │                        │
  ├─ Choisit livraison ─────►│                           │                        │
  │   (RELAY, relayPointId)  │                           │                        │
  │                          │                           │                        │
  ├─ Confirme commande ─────►│                           │                        │
  │                          ├─ POST /cshop/orders/checkout ─► checkout()         │
  │                          │   { deliveryOption: 'relay',  │ Vérifie stock      │
  │                          │     relayPointId: '...',      │ Applique promo     │
  │                          │     promoCode: 'PROMO20' }    │ Calcule livraison  │
  │                          │                           │   INSERT orders        │
  │                          │◄──── { orderId, total } ──┤   CLEAR cart          │
  │                          │                           │                        │
  ├─ Paiement ──────────────►│                           │                        │
  │                          ├─ POST /payments/init ────►│ PaymentsService        │
  │                          │   { orderId, provider }   │                        │
  │                          │◄──── { paymentUrl } ──────┤                        │
  │                          │                           │                        │
  ├─ Valide paiement ───────►│                           │                        │
  │  (Stripe/MoMo/etc.)      │      [Webhook provider]   │                        │
  │                          │           ├── POST /payments/webhook/:provider ──►  │
  │                          │           │                │ emit('payment.success')│
  │                          │           │                │ @OnEvent               │
  │                          │           │                │ order.isPaid = true    │
  │                          │           │                │ UPDATE orders          │
  │                          │           │                │                        │
  ├─ Reçoit confirmation ────│◄──────────│────────────────┤                        │
```

---

## Modes de livraison

| Mode | Enum | Frais | Conditions |
|------|------|-------|------------|
| **C'Express** | `cexpress` | ~7500 XAF (dynamique) | Adresse de livraison requise |
| **Gratuite** | `free` | 0 XAF | Aucune |
| **Point Relais** | `relay` | 0 XAF | `relayPointId` valide requis |
| **Entrepôt** | `warehouse` | 0 XAF | Retrait sur place |

### Calcul des frais C'Express

```typescript
// Dans OrderService.checkout()
if (payload.deliveryOption === DeliveryOption.CEXPRESS) {
  const quote = await this.cexpressService.quoteDelivery({
    pickupAddress: 'Entrepôt C\'EMPIRE',
    deliveryAddress: payload.deliveryAddress,
  });
  deliveryFee = quote.price; // Prix calculé par C'Express
}
```

---

## Promotions

### Types de promotion

| Type | Calcul | Exemple |
|------|--------|---------|
| `PERCENT` | `subtotal × value / 100` | `PROMO20` = -20% |
| `FIXED` | `subtotal - value` | `REDUCE5000` = -5000 XAF |

### Règles de validation

Un code promo est valide si :
1. ✅ Il existe en base de données
2. ✅ `isActive = true`
3. ✅ `expiresAt > now` (ou expiresAt non défini)
4. ✅ `usedCount < maxUses` (ou maxUses non défini)
5. ✅ `subtotal >= minOrderAmount` (ou minOrderAmount non défini)

---

*Voir aussi :*
- *[09-paiements.md](09-paiements.md) pour le système de paiement*
- *[05-module-cexpress.md](05-module-cexpress.md) pour la livraison C'Express*
