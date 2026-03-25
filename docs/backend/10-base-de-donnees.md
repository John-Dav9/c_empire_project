# Base de Données — C'EMPIRE

> PostgreSQL · TypeORM · Schéma complet

## Connexion

```
Host     : DB_HOST (ex: 127.0.0.1 en dev, host Render en prod)
Port     : DB_PORT (5432)
Database : c_empire
User     : c_empire_user
Password : DB_PASSWORD
```

## Mode de synchronisation

| Environnement | `synchronize` | Comportement |
|--------------|---------------|-------------|
| **Dev** | `true` | TypeORM crée/modifie les tables automatiquement |
| **Prod** | `false` | Les tables doivent être créées manuellement |

> ⚠️ En production, si le schéma d'une entité change, il faut créer une migration manuellement.

## Schéma complet

### Authentification

```sql
-- Table principale des utilisateurs
users (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email       VARCHAR UNIQUE NOT NULL,
  password    VARCHAR NOT NULL,                    -- Hash bcrypt
  role        users_role_enum DEFAULT 'client',   -- client|admin|employee|super_admin
  specialty   users_specialty_enum,               -- Sous-rôle employé (nullable)
  "isActive"  BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
)

-- Profils utilisateurs (1:1 avec users)
profiles (
  id         UUID PRIMARY KEY,
  "userId"   UUID REFERENCES users(id) ON DELETE CASCADE,
  firstname  VARCHAR,
  lastname   VARCHAR,
  phone      VARCHAR,
  avatar     VARCHAR,    -- URL image
  address    VARCHAR,
  city       VARCHAR,
  bio        TEXT
)
```

### C'Shop

```sql
-- Produits
products (
  id           UUID PRIMARY KEY,
  name         VARCHAR NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2),
  stock        INTEGER DEFAULT 0,
  images       TEXT[],            -- Tableau d'URLs
  category     VARCHAR,
  sku          VARCHAR UNIQUE,
  "isActive"   BOOLEAN DEFAULT true,
  ratings      DECIMAL(3,2) DEFAULT 0,
  "reviewCount" INTEGER DEFAULT 0,
  "createdAt"  TIMESTAMP,
  "updatedAt"  TIMESTAMP
)

-- Paniers
carts (
  id         UUID PRIMARY KEY,
  "userId"   UUID REFERENCES users(id),
  "isActive" BOOLEAN DEFAULT true,
  "createdAt" TIMESTAMP,
  "updatedAt" TIMESTAMP
)

-- Lignes de panier
cart_items (
  id          UUID PRIMARY KEY,
  "cartId"    UUID REFERENCES carts(id) ON DELETE CASCADE,
  "productId" UUID REFERENCES products(id),
  quantity    INTEGER NOT NULL
)

-- Commandes
orders (
  id               UUID PRIMARY KEY,
  "userId"         UUID REFERENCES users(id),
  "totalAmount"    DECIMAL(10,2),
  subtotal         DECIMAL(10,2),
  "deliveryFee"    DECIMAL(10,2) DEFAULT 0,
  "promoCode"      VARCHAR,
  "promoDiscount"  DECIMAL(10,2) DEFAULT 0,
  status           orders_status_enum DEFAULT 'pending',
  "deliveryOption" orders_deliveryoption_enum DEFAULT 'free',
  "deliveryAddress" VARCHAR,
  "relayPointId"   UUID,
  "isPaid"         BOOLEAN DEFAULT false,
  "paymentId"      UUID,
  "deliveryStatus" VARCHAR,
  "createdAt"      TIMESTAMP,
  "updatedAt"      TIMESTAMP
)

-- Lignes de commande
order_items (
  id           UUID PRIMARY KEY,
  "orderId"    UUID REFERENCES orders(id) ON DELETE CASCADE,
  "productId"  UUID REFERENCES products(id),
  quantity     INTEGER,
  "unitPrice"  DECIMAL(10,2),
  "linePrice"  DECIMAL(10,2),
  "productName" VARCHAR       -- Snapshot au moment de la commande
)

-- Promotions
promotions (
  id               UUID PRIMARY KEY,
  code             VARCHAR UNIQUE NOT NULL,
  type             promotions_type_enum,   -- PERCENT | FIXED
  value            DECIMAL(10,2),
  "minOrderAmount" DECIMAL(10,2),
  "maxUses"        INTEGER,
  "usedCount"      INTEGER DEFAULT 0,
  "expiresAt"      TIMESTAMP,
  "isActive"       BOOLEAN DEFAULT true
)

-- Points relais
relay_points (
  id             UUID PRIMARY KEY,
  name           VARCHAR NOT NULL,
  address        VARCHAR NOT NULL,
  city           VARCHAR NOT NULL,
  phone          VARCHAR,
  "openingHours" VARCHAR,
  lat            DECIMAL(9,6),
  lng            DECIMAL(9,6),
  "isActive"     BOOLEAN DEFAULT true,
  note           TEXT
)

-- Avis produits
reviews (
  id           UUID PRIMARY KEY,
  "productId"  UUID REFERENCES products(id),
  "userId"     UUID REFERENCES users(id),
  rating       INTEGER CHECK (rating BETWEEN 1 AND 5),
  comment      TEXT,
  "isApproved" BOOLEAN DEFAULT false,
  "createdAt"  TIMESTAMP
)
```

### C'Grill

```sql
grill_products (
  id           UUID PRIMARY KEY,
  title        VARCHAR NOT NULL,
  description  TEXT,
  price        DECIMAL(10,2),
  "promoPrice" DECIMAL(10,2),
  category     VARCHAR,
  "isAvailable" BOOLEAN DEFAULT true,
  "isFeatured"  BOOLEAN DEFAULT false,
  "stockQty"    INTEGER DEFAULT 0,
  images       TEXT[],
  "prepTimeMin" INTEGER,
  tags         TEXT[]
)

grill_orders (
  id             UUID PRIMARY KEY,
  "fullName"     VARCHAR NOT NULL,
  email          VARCHAR NOT NULL,
  phone          VARCHAR NOT NULL,
  "deliveryMode" VARCHAR,         -- PICKUP | DELIVERY
  address        VARCHAR,
  subtotal       DECIMAL(10,2),
  "deliveryFee"  DECIMAL(10,2),
  total          DECIMAL(10,2),
  status         VARCHAR DEFAULT 'PENDING',
  "paymentId"    UUID,
  "expressOrderId" UUID,
  "isPaid"       BOOLEAN DEFAULT false,
  "createdAt"    TIMESTAMP
)

grill_order_items (
  id              UUID PRIMARY KEY,
  "orderId"       UUID REFERENCES grill_orders(id),
  "productId"     UUID REFERENCES grill_products(id),
  "titleSnapshot" VARCHAR,
  "unitPrice"     DECIMAL(10,2),
  qty             INTEGER,
  "lineTotal"     DECIMAL(10,2)
)

grill_menu_packs (
  id          UUID PRIMARY KEY,
  name        VARCHAR NOT NULL,
  description TEXT,
  price       DECIMAL(10,2),
  "isActive"  BOOLEAN DEFAULT true
)

grill_menu_pack_items (
  id         UUID PRIMARY KEY,
  "packId"   UUID REFERENCES grill_menu_packs(id),
  "productId" UUID REFERENCES grill_products(id),
  quantity   INTEGER
)
```

### C'Express

```sql
deliveries (
  id                   UUID PRIMARY KEY,
  "userId"             UUID REFERENCES users(id),
  "pickupAddress"      VARCHAR NOT NULL,
  "deliveryAddress"    VARCHAR NOT NULL,
  "pickupLat"          DECIMAL(9,6),
  "pickupLng"          DECIMAL(9,6),
  "deliveryLat"        DECIMAL(9,6),
  "deliveryLng"        DECIMAL(9,6),
  "packageType"        VARCHAR,
  "weightKg"           DECIMAL(6,2),
  "distanceKm"         DECIMAL(8,2),
  "urgencyLevel"       VARCHAR DEFAULT 'standard',
  price                DECIMAL(10,2),
  paid                 BOOLEAN DEFAULT false,
  "courierId"          UUID,
  status               VARCHAR DEFAULT 'PENDING',
  notes                TEXT,
  "estimatedDeliveryAt" TIMESTAMP,
  "createdAt"          TIMESTAMP
)

couriers (
  id                    UUID PRIMARY KEY,
  "userId"              UUID REFERENCES users(id),
  "vehicleType"         VARCHAR,
  "isAvailable"         BOOLEAN DEFAULT true,
  "currentLat"          DECIMAL(9,6),
  "currentLng"          DECIMAL(9,6),
  rating                DECIMAL(3,2) DEFAULT 5.0,
  "completedDeliveries" INTEGER DEFAULT 0
)

import_exports (
  id                   UUID PRIMARY KEY,
  "userId"             UUID REFERENCES users(id),
  direction            VARCHAR,         -- IMPORT | EXPORT
  "originCountry"      VARCHAR,
  "destinationCountry" VARCHAR,
  description          TEXT,
  "weightKg"           DECIMAL(6,2),
  "estimatedValue"     DECIMAL(10,2),
  status               VARCHAR DEFAULT 'PENDING',
  price                DECIMAL(10,2)
)
```

### C'Clean

```sql
clean_services (
  id          UUID PRIMARY KEY,
  title       VARCHAR NOT NULL,
  description TEXT,
  "basePrice" DECIMAL(10,2),
  unit        VARCHAR,
  images      TEXT[],
  "isActive"  BOOLEAN DEFAULT true
)

clean_bookings (
  id              UUID PRIMARY KEY,
  "userId"        UUID REFERENCES users(id),
  "fullName"      VARCHAR,
  email           VARCHAR,
  phone           VARCHAR,
  "cleanServiceId" UUID REFERENCES clean_services(id),
  "serviceTitle"  VARCHAR,
  amount          DECIMAL(10,2),
  currency        VARCHAR DEFAULT 'XAF',
  address         VARCHAR,
  city            VARCHAR,
  "scheduledAt"   TIMESTAMP,
  status          VARCHAR DEFAULT 'DRAFT',
  "paymentId"     UUID,
  "assignedTo"    UUID REFERENCES users(id),
  notes           TEXT,
  "quoteId"       UUID
)

clean_quotes (
  id               UUID PRIMARY KEY,
  "bookingId"      UUID REFERENCES clean_bookings(id),
  "estimatedPrice" DECIMAL(10,2),
  details          TEXT,
  "validUntil"     TIMESTAMP,
  status           VARCHAR DEFAULT 'PENDING'
)

clean_reviews (
  id          UUID PRIMARY KEY,
  "bookingId" UUID REFERENCES clean_bookings(id),
  "userId"    UUID REFERENCES users(id),
  rating      INTEGER,
  comment     TEXT,
  "isApproved" BOOLEAN DEFAULT false
)
```

### C'Events

```sql
events (
  id                  UUID PRIMARY KEY,
  title               VARCHAR NOT NULL,
  description         TEXT,
  category            VARCHAR,
  "basePrice"         DECIMAL(10,2),
  "isActive"          BOOLEAN DEFAULT true,
  images              TEXT[],
  "startDate"         TIMESTAMP,
  "endDate"           TIMESTAMP,
  location            VARCHAR,
  "maxParticipants"   INTEGER,
  "currentParticipants" INTEGER DEFAULT 0
)

event_bookings (
  id            UUID PRIMARY KEY,
  "userId"      UUID REFERENCES users(id),
  "eventId"     UUID REFERENCES events(id),
  status        VARCHAR DEFAULT 'PENDING',
  "paymentId"   UUID,
  options       JSONB,
  "totalAmount" DECIMAL(10,2),
  "isPaid"      BOOLEAN DEFAULT false,
  notes         TEXT
)
```

### C'Todo / Tasks

```sql
todo_services (
  id                    UUID PRIMARY KEY,
  title                 VARCHAR NOT NULL,
  description           TEXT,
  "basePrice"           DECIMAL(10,2),
  "priceUnit"           VARCHAR,
  category              VARCHAR,
  "isActive"            BOOLEAN DEFAULT true,
  images                TEXT[],
  "estimatedDurationMin" INTEGER
)

todo_orders (
  id                 UUID PRIMARY KEY,
  "userId"           UUID REFERENCES users(id),
  "serviceId"        UUID REFERENCES todo_services(id),
  "serviceTitle"     VARCHAR,
  address            VARCHAR,
  "scheduledAt"      TIMESTAMP,
  status             VARCHAR DEFAULT 'PENDING',
  amount             DECIMAL(10,2),
  "isPaid"           BOOLEAN DEFAULT false,
  "assignedEmployeeId" UUID REFERENCES users(id),
  notes              TEXT
)
```

### Paiements & Core

```sql
payments (
  id                      UUID PRIMARY KEY,
  "userId"                UUID REFERENCES users(id),
  amount                  DECIMAL(10,2),
  currency                VARCHAR DEFAULT 'XAF',
  provider                VARCHAR,
  status                  VARCHAR DEFAULT 'pending',
  "referenceType"         VARCHAR,
  "referenceId"           UUID,
  "providerTransactionId" VARCHAR,
  "providerPaymentUrl"    VARCHAR,
  metadata                JSONB,
  "webhookReceivedAt"     TIMESTAMP,
  "createdAt"             TIMESTAMP,
  "updatedAt"             TIMESTAMP
)

notifications (
  id        UUID PRIMARY KEY,
  "userId"  UUID REFERENCES users(id),
  channel   VARCHAR,   -- EMAIL | SMS | WHATSAPP | IN_APP
  subject   VARCHAR,
  content   TEXT,
  "sentAt"  TIMESTAMP,
  "isRead"  BOOLEAN DEFAULT false
)

roles (
  id          UUID PRIMARY KEY,
  code        VARCHAR UNIQUE,
  label       VARCHAR,
  permissions TEXT[]
)

sectors (
  id          UUID PRIMARY KEY,
  name        VARCHAR UNIQUE,
  description TEXT,
  "isActive"  BOOLEAN DEFAULT true
)

platform_settings (
  id    UUID PRIMARY KEY,
  key   VARCHAR UNIQUE,
  value JSONB
)

news_messages (
  id          UUID PRIMARY KEY,
  title       VARCHAR,
  content     TEXT,
  "isPublished" BOOLEAN DEFAULT false,
  "publishedAt" TIMESTAMP
)

seasonal_campaigns (
  id          UUID PRIMARY KEY,
  title       VARCHAR,
  description TEXT,
  imageUrl    VARCHAR,
  "startDate" TIMESTAMP,
  "endDate"   TIMESTAMP,
  "isActive"  BOOLEAN DEFAULT true
)
```

---

## Relations importantes

```
users 1──────────────── 1 profiles
users 1────────────── ∞ orders
users 1────────────── ∞ carts
users 1────────────── ∞ event_bookings
users 1────────────── ∞ clean_bookings
users 1────────────── ∞ todo_orders
users 1────────────── ∞ deliveries
users 1────────────── ∞ payments

carts 1──────────────── ∞ cart_items
cart_items ∞──────────── 1 products

orders 1──────────────── ∞ order_items
order_items ∞──────────── 1 products

grill_orders 1────────── ∞ grill_order_items
grill_menu_packs 1──────── ∞ grill_menu_pack_items

payments 1────────────── 1 orders (via referenceId)
```

---

## Scripts de gestion

```bash
# Initialiser le schéma (dev)
npm run db:bootstrap

# Seeder des données de test
npm run seed:test-users    # 9 comptes de test
npm run seed:demo          # Données de démonstration complètes
npm run seed:admin         # Compte admin seulement

# Migration manuelle de l'enum livraison
npm run migrate:delivery-options

# Vérifier un compte admin
npm run check:admin-login

# Réinitialiser le mot de passe admin
npm run reset:admin-password
```
