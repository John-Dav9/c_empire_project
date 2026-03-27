-- =============================================================================
-- C'EMPIRE — Migration complète PostgreSQL (Supabase)
-- Fichier   : 001_full_schema.sql
-- Date      : 2026-03-26
-- Usage     : Coller dans l'éditeur SQL de Supabase et exécuter.
--             Entièrement IDEMPOTENT : peut être rejoué sans risque.
-- Notes     :
--   • synchronize: false dans TypeORM → ce fichier fait foi pour le schéma.
--   • Les noms de colonnes respectent la casse camelCase de TypeORM.
--   • Les tables marquées [NOUVEAU] n'existent pas encore en production.
-- =============================================================================

-- ============================================================
-- 0. EXTENSION UUID
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";


-- ============================================================
-- 1. TYPES ENUM (idempotents via bloc DO ... EXCEPTION)
-- ============================================================

-- Utilisateurs
DO $$ BEGIN
  CREATE TYPE user_role_enum AS ENUM ('client','employee','admin','super_admin');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE employee_specialty_enum AS ENUM (
    'livreur','evenementialiste','coursier','nettoyeur','bricoleur','point_relais'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C'Shop — commandes
DO $$ BEGIN
  CREATE TYPE order_status_enum AS ENUM (
    'pending','confirmed','paid','preparing','shipped','delivered','cancelled','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE delivery_option_enum AS ENUM ('cexpress','free','relay','warehouse');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE order_delivery_status_enum AS ENUM (
    'pending','quoted','assigned','picked','delivered','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C'Shop — promotions
DO $$ BEGIN
  CREATE TYPE promotion_type_enum AS ENUM ('percent','fixed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Paiements
DO $$ BEGIN
  CREATE TYPE payment_status_enum AS ENUM ('PENDING','SUCCESS','FAILED','CANCELED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_provider_enum AS ENUM (
    'stripe','wave','paypal','mtn_momo','orange_money','wallet','card'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE payment_reference_type_enum AS ENUM (
    'shop_order','express_delivery','express_import_export',
    'event_booking','clean_booking','todo_task','grillfood_order'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C'Express
DO $$ BEGIN
  CREATE TYPE delivery_status_enum AS ENUM (
    'pending','confirmed','assigned','in_transit','delivered','canceled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE import_export_status_enum AS ENUM (
    'requested','quoted','accepted','in_progress','completed','rejected'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C'Clean
DO $$ BEGIN
  CREATE TYPE clean_booking_status_enum AS ENUM (
    'DRAFT','PAYMENT_PENDING','CONFIRMED','ASSIGNED','IN_PROGRESS','DONE','CANCELLED','FAILED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clean_quote_status_enum AS ENUM (
    'PENDING','REVIEWING','SENT','ACCEPTED','REJECTED','EXPIRED','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clean_review_status_enum AS ENUM ('PENDING','APPROVED','REJECTED');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE clean_service_type_enum AS ENUM (
    'HOME','OFFICE','CONSTRUCTION','AFTER_EVENT','MOVE_OUT','DISINFECTION','WINDOWS','PERIODIC'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C'Events
DO $$ BEGIN
  CREATE TYPE event_category_enum AS ENUM (
    'MARIAGE','BAPTEME','ANNIVERSAIRE','DEUIL','SOUTENANCE','CONFERENCE','SEMINAIRE','SURPRISE'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE event_booking_status_enum AS ENUM (
    'PENDING','VALIDATED','REFUSED','PAID','CANCELLED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C'Grill
DO $$ BEGIN
  CREATE TYPE grill_order_status_enum AS ENUM (
    'PENDING','PAID','CONFIRMED','PREPARING','READY','OUT_FOR_DELIVERY','DELIVERED','CANCELLED','REFUSED'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE grill_delivery_mode_enum AS ENUM ('PICKUP','DELIVERY');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Tasks
DO $$ BEGIN
  CREATE TYPE task_status_enum AS ENUM ('pending','in_progress','completed','cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE task_priority_enum AS ENUM ('low','medium','high','urgent');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- C'Todo
DO $$ BEGIN
  CREATE TYPE todo_order_status_enum AS ENUM (
    'pending','confirmed','in_progress','completed','cancelled'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;


-- ============================================================
-- 2. TABLES SANS DÉPENDANCES (ordre de création libre)
-- ============================================================

-- Secteurs d'activité
CREATE TABLE IF NOT EXISTS sectors (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  name        VARCHAR     NOT NULL,
  description TEXT,
  code        VARCHAR(50),
  "iconUrl"   TEXT,
  "imageUrls" TEXT,                         -- simple-json TypeORM (texte sérialisé)
  "isActive"  BOOLEAN     NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT sectors_name_uq UNIQUE (name),
  CONSTRAINT sectors_code_uq UNIQUE (code)
);

-- Rôles personnalisés (système de permissions dynamiques)
CREATE TABLE IF NOT EXISTS roles (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  code        VARCHAR NOT NULL,
  label       VARCHAR,
  permissions TEXT,                         -- simple-array TypeORM
  CONSTRAINT roles_code_uq UNIQUE (code)
);

-- Paramètres plateforme (clé / valeur JSON)
CREATE TABLE IF NOT EXISTS platform_settings (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  key         VARCHAR(120) NOT NULL,
  value       JSONB       NOT NULL,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_settings_key_uq UNIQUE (key)
);

-- Messages d'actualités (bandeau homepage)
CREATE TABLE IF NOT EXISTS news_messages (
  id          UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(140) NOT NULL,
  message     TEXT        NOT NULL,
  "isActive"  BOOLEAN     NOT NULL DEFAULT true,
  priority    INT         NOT NULL DEFAULT 0,
  "startDate" TIMESTAMP,
  "endDate"   TIMESTAMP,
  "createdAt" TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Campagnes saisonnières
CREATE TABLE IF NOT EXISTS seasonal_campaigns (
  id            UUID        PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(120) NOT NULL,
  "festivalName" VARCHAR(120) NOT NULL,
  "tabLabel"    VARCHAR(120),
  "startDate"   TIMESTAMP   NOT NULL,
  "endDate"     TIMESTAMP   NOT NULL,
  "isActive"    BOOLEAN     NOT NULL DEFAULT true,
  items         TEXT,                        -- simple-json TypeORM
  "createdAt"   TIMESTAMP   NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP   NOT NULL DEFAULT NOW()
);

-- Services C'Clean (catalogue)
CREATE TABLE IF NOT EXISTS clean_services (
  id                    UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  title                 VARCHAR(120)            NOT NULL,
  description           TEXT,
  type                  clean_service_type_enum NOT NULL,
  "isActive"            BOOLEAN                 NOT NULL DEFAULT true,
  "basePrice"           DECIMAL(12,2)           NOT NULL DEFAULT 0,
  currency              VARCHAR(8)              NOT NULL DEFAULT 'EUR',
  "estimatedDurationMin" INT                   NOT NULL DEFAULT 120,
  "imageUrl"            VARCHAR(255),
  "createdAt"           TIMESTAMP               NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP               NOT NULL DEFAULT NOW()
);

-- Points relais C'Shop
CREATE TABLE IF NOT EXISTS relay_points (
  id             UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name           VARCHAR(150) NOT NULL,
  address        VARCHAR(255) NOT NULL,
  city           VARCHAR(100) NOT NULL,
  phone          VARCHAR(30),
  "openingHours" VARCHAR(200),
  lat            DECIMAL(10,7),
  lng            DECIMAL(10,7),
  "isActive"     BOOLEAN      NOT NULL DEFAULT true,
  note           TEXT,
  "createdAt"    TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Produits C'Grill
CREATE TABLE IF NOT EXISTS grill_products (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(120) NOT NULL,
  description  TEXT,
  price        DECIMAL(12,2) NOT NULL,
  currency     VARCHAR(8)   NOT NULL DEFAULT 'XAF',
  category     VARCHAR(80),
  "isAvailable" BOOLEAN     NOT NULL DEFAULT true,
  "stockQty"   INT,
  images       TEXT,                        -- simple-array TypeORM
  "promoPrice" DECIMAL(12,2),
  "isFeatured" BOOLEAN      NOT NULL DEFAULT false,
  tags         TEXT,                        -- simple-array TypeORM
  "prepTimeMin" INT,
  "createdAt"  TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Menus / packs C'Grill
CREATE TABLE IF NOT EXISTS grill_menu_packs (
  id           UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title        VARCHAR(120) NOT NULL,
  description  TEXT,
  price        DECIMAL(12,2) NOT NULL,
  currency     VARCHAR(8)   NOT NULL DEFAULT 'XAF',
  "isAvailable" BOOLEAN     NOT NULL DEFAULT true,
  images       TEXT,                        -- simple-array TypeORM
  "createdAt"  TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Catalogue C'Todo
CREATE TABLE IF NOT EXISTS todo_services (
  id          UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(120) NOT NULL,
  description TEXT         NOT NULL,
  "basePrice" DECIMAL(10,2) NOT NULL,
  "isActive"  BOOLEAN      NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Évènements C'Events (catalogue)
CREATE TABLE IF NOT EXISTS events (
  id          UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  title       VARCHAR(150)          NOT NULL,
  description TEXT                  NOT NULL,
  category    event_category_enum   NOT NULL,
  "basePrice" DECIMAL(10,2)         NOT NULL,
  "isActive"  BOOLEAN               NOT NULL DEFAULT true,
  images      JSON,
  "createdAt" TIMESTAMP             NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP             NOT NULL DEFAULT NOW()
);

-- Coursiers C'Express
CREATE TABLE IF NOT EXISTS c_express_couriers (
  id            UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fullName"    VARCHAR(120) NOT NULL,
  phone         VARCHAR(30)  NOT NULL,
  "vehicleType" VARCHAR(50)  NOT NULL,
  available     BOOLEAN      NOT NULL DEFAULT true,
  city          VARCHAR(100),
  country       VARCHAR(100),
  "adminNote"   TEXT,
  "createdAt"   TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP    NOT NULL DEFAULT NOW()
);

-- Demandes de devis C'Clean (visiteurs, pas forcément users)
CREATE TABLE IF NOT EXISTS clean_quotes (
  id               UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fullName"       VARCHAR(120)          NOT NULL,
  email            VARCHAR(120)          NOT NULL,
  phone            VARCHAR(40),
  "serviceTitle"   VARCHAR(120)          NOT NULL,
  "requestDetails" TEXT                  NOT NULL,
  address          VARCHAR(200)          NOT NULL,
  city             VARCHAR,
  "preferredDate"  VARCHAR,
  status           clean_quote_status_enum NOT NULL DEFAULT 'PENDING',
  "proposedAmount" DECIMAL(12,2),
  currency         VARCHAR(8)            NOT NULL DEFAULT 'EUR',
  "adminMessage"   TEXT,
  "createdAt"      TIMESTAMP             NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP             NOT NULL DEFAULT NOW()
);

-- Avis C'Clean
CREATE TABLE IF NOT EXISTS clean_reviews (
  id              UUID                   PRIMARY KEY DEFAULT uuid_generate_v4(),
  "bookingId"     VARCHAR                NOT NULL,
  "cleanServiceId" VARCHAR,
  "fullName"      VARCHAR(120)           NOT NULL,
  email           VARCHAR(120)           NOT NULL,
  rating          INT                    NOT NULL,
  comment         TEXT,
  status          clean_review_status_enum NOT NULL DEFAULT 'PENDING',
  "createdAt"     TIMESTAMP              NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP              NOT NULL DEFAULT NOW(),
  CONSTRAINT clean_reviews_rating_chk CHECK (rating BETWEEN 1 AND 5)
);


-- ============================================================
-- 3. PROFILS (avant users car users a une FK vers profile)
-- ============================================================
-- Note : la FK est dans users.profileId → profile.id
-- Profile n'a pas de colonne userId (le lien est porté par users)

CREATE TABLE IF NOT EXISTS profile (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  "firstName" VARCHAR,
  "lastName"  VARCHAR,
  phone       VARCHAR,
  avatar      VARCHAR
);


-- ============================================================
-- 4. USERS (dépend de sectors et profile)
-- ============================================================
CREATE TABLE IF NOT EXISTS users (
  id                    UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
  email                 VARCHAR                   NOT NULL,
  password              VARCHAR                   NOT NULL,
  role                  user_role_enum            NOT NULL DEFAULT 'client',
  firstname             VARCHAR,
  lastname              VARCHAR,
  phone                 VARCHAR,
  "isActive"            BOOLEAN                   NOT NULL DEFAULT true,
  "resetPasswordToken"  VARCHAR,
  "resetPasswordExpires" TIMESTAMPTZ,
  "refreshTokenHash"    VARCHAR,
  "sectorId"            UUID,
  specialty             employee_specialty_enum,
  "profileId"           UUID,                     -- FK OneToOne vers profile.id (@JoinColumn sur User)
  "createdAt"           TIMESTAMP                 NOT NULL DEFAULT NOW(),
  "updatedAt"           TIMESTAMP                 NOT NULL DEFAULT NOW(),
  CONSTRAINT users_email_uq      UNIQUE (email),
  CONSTRAINT users_profileid_uq  UNIQUE ("profileId"),
  CONSTRAINT users_sectorid_fk   FOREIGN KEY ("sectorId")  REFERENCES sectors(id) ON DELETE SET NULL,
  CONSTRAINT users_profileid_fk  FOREIGN KEY ("profileId") REFERENCES profile(id)  ON DELETE SET NULL
);


-- ============================================================
-- 5. TABLES DE JOINTURE : users ↔ roles
-- ============================================================
-- TypeORM @JoinTable({ name: 'user_roles' }) côté User.roles
-- Colonnes générées : "usersId" (owner=User) et "rolesId" (inverse=Role)

CREATE TABLE IF NOT EXISTS user_roles (
  "usersId" UUID NOT NULL,
  "rolesId" UUID NOT NULL,
  PRIMARY KEY ("usersId", "rolesId"),
  CONSTRAINT user_roles_users_fk FOREIGN KEY ("usersId") REFERENCES users(id) ON DELETE CASCADE,
  CONSTRAINT user_roles_roles_fk FOREIGN KEY ("rolesId") REFERENCES roles(id) ON DELETE CASCADE
);


-- ============================================================
-- 6. PAIEMENTS (dépend de users)
-- ============================================================
CREATE TABLE IF NOT EXISTS payments (
  id                      UUID                          PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"                UUID,
  amount                  FLOAT                         NOT NULL,
  currency                VARCHAR                       NOT NULL,
  provider                payment_provider_enum         NOT NULL,
  status                  payment_status_enum           NOT NULL DEFAULT 'PENDING',
  "providerTransactionId" VARCHAR,
  "referenceType"         payment_reference_type_enum   NOT NULL,
  "referenceId"           VARCHAR                       NOT NULL,
  "orderId"               VARCHAR,
  "createdAt"             TIMESTAMP                     NOT NULL DEFAULT NOW(),
  CONSTRAINT payments_userid_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- 7. C'SHOP
-- ============================================================

-- Produits
CREATE TABLE IF NOT EXISTS products (
  id                  UUID         PRIMARY KEY DEFAULT uuid_generate_v4(),
  name                VARCHAR(150) NOT NULL,
  slug                VARCHAR(180) NOT NULL,
  description         TEXT,
  price               DECIMAL(10,2) NOT NULL,
  "promoPrice"        DECIMAL(10,2),
  currency            VARCHAR(10)  NOT NULL DEFAULT 'XAF',
  stock               INT          NOT NULL DEFAULT 0,
  "isActive"          BOOLEAN      NOT NULL DEFAULT true,
  categories          TEXT,                  -- simple-array TypeORM
  images              TEXT,                  -- simple-array TypeORM
  "technicalSheetPdf" TEXT,
  sku                 VARCHAR,
  "sectorId"          UUID,
  "createdAt"         TIMESTAMP    NOT NULL DEFAULT NOW(),
  "updatedAt"         TIMESTAMP    NOT NULL DEFAULT NOW(),
  CONSTRAINT products_slug_uq     UNIQUE (slug),
  CONSTRAINT products_sectorid_fk FOREIGN KEY ("sectorId") REFERENCES sectors(id) ON DELETE SET NULL
);

-- Promotions
CREATE TABLE IF NOT EXISTS promotions (
  id            UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  title         VARCHAR(120)          NOT NULL,
  code          VARCHAR(60),
  description   TEXT,
  type          promotion_type_enum   NOT NULL,
  value         DECIMAL(10,2)         NOT NULL,
  "isActive"    BOOLEAN               NOT NULL DEFAULT true,
  "startsAt"    TIMESTAMP,
  "endsAt"      TIMESTAMP,
  "createdById" UUID,
  "createdAt"   TIMESTAMP             NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP             NOT NULL DEFAULT NOW(),
  CONSTRAINT promotions_code_uq        UNIQUE (code),
  CONSTRAINT promotions_createdbyid_fk FOREIGN KEY ("createdById") REFERENCES users(id) ON DELETE SET NULL
);

-- Jointure : promotions ↔ products
-- TypeORM @JoinTable sur Promotion.products → "promotionId" et "productId"
CREATE TABLE IF NOT EXISTS promotion_products (
  "promotionId" UUID NOT NULL,
  "productId"   UUID NOT NULL,
  PRIMARY KEY ("promotionId", "productId"),
  CONSTRAINT promo_products_promo_fk   FOREIGN KEY ("promotionId") REFERENCES promotions(id) ON DELETE CASCADE,
  CONSTRAINT promo_products_product_fk FOREIGN KEY ("productId")   REFERENCES products(id)   ON DELETE CASCADE
);

-- Avis produits
CREATE TABLE IF NOT EXISTS product_reviews (
  id          UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"    VARCHAR   NOT NULL,
  "productId" VARCHAR   NOT NULL,
  rating      INT       NOT NULL,
  comment     TEXT,
  "isVisible" BOOLEAN   NOT NULL DEFAULT true,
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT product_reviews_rating_chk   CHECK (rating BETWEEN 1 AND 5),
  CONSTRAINT product_reviews_user_prod_uq UNIQUE ("userId", "productId")
);

-- Paniers
CREATE TABLE IF NOT EXISTS carts (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"      VARCHAR       NOT NULL,
  "totalAmount" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "isActive"    BOOLEAN       NOT NULL DEFAULT true,
  "createdAt"   TIMESTAMP     NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP     NOT NULL DEFAULT NOW()
);

-- Articles du panier
CREATE TABLE IF NOT EXISTS cart_items (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId"   VARCHAR       NOT NULL,
  "productName" VARCHAR       NOT NULL,
  "unitPrice"   DECIMAL(10,2) NOT NULL,
  quantity      INT           NOT NULL DEFAULT 1,
  "cartId"      UUID          NOT NULL,
  CONSTRAINT cart_items_cartid_fk FOREIGN KEY ("cartId") REFERENCES carts(id) ON DELETE CASCADE
);

-- Commandes C'Shop
CREATE TABLE IF NOT EXISTS orders (
  id               UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"         VARCHAR                 NOT NULL,
  "totalAmount"    DECIMAL(10,2)           NOT NULL,
  "promoCode"      VARCHAR,
  "promoDiscount"  DECIMAL(10,2)           NOT NULL DEFAULT 0,
  status           order_status_enum       NOT NULL DEFAULT 'pending',
  "paymentMethod"  VARCHAR,
  "deliveryOption" delivery_option_enum    NOT NULL DEFAULT 'free',
  "deliveryFee"    DECIMAL(10,2)           NOT NULL DEFAULT 0,
  "deliveryAddress" VARCHAR,
  "relayPointId"   UUID,
  "isPaid"         BOOLEAN                 NOT NULL DEFAULT false,
  "deliveryStatus" VARCHAR                 NOT NULL DEFAULT 'pending',
  note             VARCHAR,
  "createdAt"      TIMESTAMP               NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP               NOT NULL DEFAULT NOW()
);

-- Lignes de commande
CREATE TABLE IF NOT EXISTS order_items (
  id            UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  "productId"   VARCHAR       NOT NULL,
  "productName" VARCHAR       NOT NULL,
  "unitPrice"   DECIMAL(10,2) NOT NULL,
  quantity      INT           NOT NULL,
  "orderId"     UUID          NOT NULL,
  CONSTRAINT order_items_orderid_fk FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE
);

-- [NOUVEAU] Jointure : orders ↔ users (assignés employés)
-- TypeORM @JoinTable({ name: 'order_assignees' }) côté Order.assignees
-- Colonnes : "orderId" (owner=Order) et "userId" (inverse=User)
CREATE TABLE IF NOT EXISTS order_assignees (
  "orderId" UUID NOT NULL,
  "userId"  UUID NOT NULL,
  PRIMARY KEY ("orderId", "userId"),
  CONSTRAINT order_assignees_order_fk FOREIGN KEY ("orderId") REFERENCES orders(id) ON DELETE CASCADE,
  CONSTRAINT order_assignees_user_fk  FOREIGN KEY ("userId")  REFERENCES users(id)  ON DELETE CASCADE
);


-- ============================================================
-- 8. C'EXPRESS
-- ============================================================

-- Livraisons
CREATE TABLE IF NOT EXISTS c_express_deliveries (
  id               UUID                  PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"         UUID                  NOT NULL,
  "pickupAddress"  VARCHAR(255)          NOT NULL,
  "deliveryAddress" VARCHAR(255)         NOT NULL,
  "pickupLat"      DECIMAL(10,7),
  "pickupLng"      DECIMAL(10,7),
  "deliveryLat"    DECIMAL(10,7),
  "deliveryLng"    DECIMAL(10,7),
  "packageType"    VARCHAR(60)           NOT NULL,
  "weightKg"       FLOAT                 NOT NULL DEFAULT 0,
  "distanceKm"     FLOAT,
  "urgencyLevel"   INT                   NOT NULL DEFAULT 1,
  price            FLOAT                 NOT NULL DEFAULT 0,
  paid             BOOLEAN               NOT NULL DEFAULT false,
  "courierId"      UUID,
  status           delivery_status_enum  NOT NULL DEFAULT 'pending',
  "customerNote"   TEXT,
  "adminNote"      TEXT,
  "createdAt"      TIMESTAMP             NOT NULL DEFAULT NOW(),
  "updatedAt"      TIMESTAMP             NOT NULL DEFAULT NOW()
);

-- Import / Export
CREATE TABLE IF NOT EXISTS c_express_import_export (
  id                   UUID                        PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"             UUID                        NOT NULL,
  "originCountry"      VARCHAR(100)                NOT NULL,
  "destinationCountry" VARCHAR(100)                NOT NULL,
  description          VARCHAR(255)                NOT NULL,
  "weightKg"           FLOAT                       NOT NULL DEFAULT 0,
  "volumeM3"           FLOAT                       NOT NULL DEFAULT 0,
  "estimatedPrice"     FLOAT,
  "finalPrice"         FLOAT,
  status               import_export_status_enum   NOT NULL DEFAULT 'requested',
  "adminComment"       TEXT,
  "customerNote"       TEXT,
  "createdAt"          TIMESTAMP                   NOT NULL DEFAULT NOW(),
  "updatedAt"          TIMESTAMP                   NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 9. C'CLEAN
-- ============================================================

-- Réservations
CREATE TABLE IF NOT EXISTS clean_bookings (
  id                UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"          UUID,
  "fullName"        VARCHAR(120)              NOT NULL,
  email             VARCHAR(120)              NOT NULL,
  phone             VARCHAR(40),
  "cleanServiceId"  VARCHAR                   NOT NULL,
  "serviceTitle"    VARCHAR(120)              NOT NULL,
  amount            DECIMAL(12,2)             NOT NULL,
  currency          VARCHAR(8)                NOT NULL DEFAULT 'EUR',
  address           VARCHAR(200)              NOT NULL,
  city              VARCHAR,
  "scheduledAt"     VARCHAR                   NOT NULL,
  status            clean_booking_status_enum NOT NULL DEFAULT 'DRAFT',
  "paymentId"       VARCHAR,
  "paymentProvider" VARCHAR,
  "paidAt"          VARCHAR,
  "assignedTo"      VARCHAR,                  -- identifiant employé (texte libre)
  notes             TEXT,
  "createdAt"       TIMESTAMP                 NOT NULL DEFAULT NOW(),
  "updatedAt"       TIMESTAMP                 NOT NULL DEFAULT NOW(),
  CONSTRAINT clean_bookings_userid_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- 10. C'TODO
-- ============================================================

CREATE TABLE IF NOT EXISTS todo_orders (
  id              UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fullName"      VARCHAR(120)            NOT NULL,
  email           VARCHAR(120)            NOT NULL,
  "userId"        VARCHAR,
  phone           VARCHAR(40),
  "todoServiceId" VARCHAR                 NOT NULL,
  "serviceTitle"  VARCHAR(120)            NOT NULL,
  instructions    TEXT,
  address         VARCHAR(200)            NOT NULL,
  "scheduledAt"   TIMESTAMP               NOT NULL,
  amount          DECIMAL(10,2)           NOT NULL,
  currency        VARCHAR(8)              NOT NULL DEFAULT 'XAF',
  status          todo_order_status_enum  NOT NULL DEFAULT 'pending',
  "createdAt"     TIMESTAMP               NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP               NOT NULL DEFAULT NOW()
);


-- ============================================================
-- 11. C'GRILL
-- ============================================================

-- Items de menus/packs
CREATE TABLE IF NOT EXISTS grill_menu_pack_items (
  id          UUID    PRIMARY KEY DEFAULT uuid_generate_v4(),
  "packId"    UUID    NOT NULL,
  "productId" VARCHAR NOT NULL,
  qty         INT     NOT NULL DEFAULT 1,
  CONSTRAINT grill_pack_items_packid_fk FOREIGN KEY ("packId") REFERENCES grill_menu_packs(id) ON DELETE CASCADE
);

-- Commandes C'Grill
CREATE TABLE IF NOT EXISTS grill_orders (
  id             UUID                    PRIMARY KEY DEFAULT uuid_generate_v4(),
  "fullName"     VARCHAR(120)            NOT NULL,
  email          VARCHAR(120)            NOT NULL,
  phone          VARCHAR(40),
  "deliveryMode" grill_delivery_mode_enum NOT NULL,
  address        VARCHAR(200),
  subtotal       DECIMAL(12,2)           NOT NULL DEFAULT 0,
  "deliveryFee"  DECIMAL(12,2)           NOT NULL DEFAULT 0,
  total          DECIMAL(12,2)           NOT NULL DEFAULT 0,
  currency       VARCHAR(8)              NOT NULL DEFAULT 'XAF',
  status         grill_order_status_enum NOT NULL DEFAULT 'PENDING',
  "paymentId"    VARCHAR,
  "expressOrderId" VARCHAR,
  "createdAt"    TIMESTAMP               NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP               NOT NULL DEFAULT NOW()
);

-- Lignes de commande C'Grill
CREATE TABLE IF NOT EXISTS grill_order_items (
  id                 UUID          PRIMARY KEY DEFAULT uuid_generate_v4(),
  "orderId"          UUID          NOT NULL,
  "productId"        VARCHAR       NOT NULL,
  "titleSnapshot"    VARCHAR(120)  NOT NULL,
  "unitPriceSnapshot" DECIMAL(12,2) NOT NULL,
  qty                INT           NOT NULL,
  "lineTotal"        DECIMAL(12,2) NOT NULL,
  CONSTRAINT grill_order_items_orderid_fk FOREIGN KEY ("orderId") REFERENCES grill_orders(id) ON DELETE CASCADE
);


-- ============================================================
-- 12. C'EVENTS
-- ============================================================

CREATE TABLE IF NOT EXISTS event_bookings (
  id            UUID                      PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"      UUID                      NOT NULL,
  "eventId"     UUID                      NOT NULL,
  "eventDate"   DATE                      NOT NULL,
  location      VARCHAR(255)              NOT NULL,
  options       JSON,
  "totalAmount" DECIMAL(10,2)             NOT NULL,
  status        event_booking_status_enum NOT NULL DEFAULT 'PENDING',
  "paymentId"   UUID,
  "createdAt"   TIMESTAMP                 NOT NULL DEFAULT NOW(),
  "updatedAt"   TIMESTAMP                 NOT NULL DEFAULT NOW(),
  CONSTRAINT event_bookings_userid_fk    FOREIGN KEY ("userId")    REFERENCES users(id)    ON DELETE CASCADE,
  CONSTRAINT event_bookings_eventid_fk   FOREIGN KEY ("eventId")   REFERENCES events(id)   ON DELETE CASCADE,
  CONSTRAINT event_bookings_paymentid_fk FOREIGN KEY ("paymentId") REFERENCES payments(id) ON DELETE SET NULL
);


-- ============================================================
-- 13. TASKS (dépend de users et sectors)
-- ============================================================

CREATE TABLE IF NOT EXISTS tasks (
  id             UUID               PRIMARY KEY DEFAULT uuid_generate_v4(),
  title          VARCHAR            NOT NULL,
  description    TEXT,
  status         task_status_enum   NOT NULL DEFAULT 'pending',
  priority       task_priority_enum NOT NULL DEFAULT 'medium',
  "assignedToId" UUID,
  "assignedById" UUID,
  "sectorId"     UUID,
  "dueDate"      TIMESTAMP,
  "completedAt"  TIMESTAMP,
  "createdAt"    TIMESTAMP          NOT NULL DEFAULT NOW(),
  "updatedAt"    TIMESTAMP          NOT NULL DEFAULT NOW(),
  CONSTRAINT tasks_assignedtoid_fk FOREIGN KEY ("assignedToId") REFERENCES users(id)   ON DELETE SET NULL,
  CONSTRAINT tasks_assignedbyid_fk FOREIGN KEY ("assignedById") REFERENCES users(id)   ON DELETE SET NULL,
  CONSTRAINT tasks_sectorid_fk     FOREIGN KEY ("sectorId")     REFERENCES sectors(id) ON DELETE SET NULL
);


-- ============================================================
-- 14. NOTIFICATIONS (dépend de users)
-- ============================================================

CREATE TABLE IF NOT EXISTS notifications (
  id        UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  "userId"  UUID,
  title     VARCHAR   NOT NULL,
  message   VARCHAR   NOT NULL,
  channel   VARCHAR   NOT NULL,           -- EMAIL | SMS | WHATSAPP | IN_APP
  status    VARCHAR   NOT NULL DEFAULT 'PENDING',
  "createdAt" TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT notifications_userid_fk FOREIGN KEY ("userId") REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- 15. PLANNING / AGENDA  [NOUVEAU]
-- ============================================================

-- Disponibilités employés
CREATE TABLE IF NOT EXISTS employee_availabilities (
  id           UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  "employeeId" UUID      NOT NULL,
  date         DATE      NOT NULL,
  "startTime"  VARCHAR(5) NOT NULL,        -- HH:MM
  "endTime"    VARCHAR(5) NOT NULL,        -- HH:MM
  "isAvailable" BOOLEAN  NOT NULL DEFAULT true,
  note         TEXT,
  "createdAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"  TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT employee_avail_employeeid_fk FOREIGN KEY ("employeeId") REFERENCES users(id) ON DELETE CASCADE
);

-- Missions planifiées
CREATE TABLE IF NOT EXISTS mission_schedules (
  id              UUID      PRIMARY KEY DEFAULT uuid_generate_v4(),
  "employeeId"    UUID      NOT NULL,
  "taskId"        UUID,
  title           VARCHAR   NOT NULL,
  description     TEXT,
  date            DATE      NOT NULL,
  "startTime"     VARCHAR(5) NOT NULL,     -- HH:MM
  "endTime"       VARCHAR(5) NOT NULL,     -- HH:MM
  "scheduledById" UUID,
  "createdAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  "updatedAt"     TIMESTAMP NOT NULL DEFAULT NOW(),
  CONSTRAINT mission_schedules_employeeid_fk   FOREIGN KEY ("employeeId")    REFERENCES users(id)  ON DELETE CASCADE,
  CONSTRAINT mission_schedules_taskid_fk       FOREIGN KEY ("taskId")        REFERENCES tasks(id)  ON DELETE SET NULL,
  CONSTRAINT mission_schedules_scheduledbyid_fk FOREIGN KEY ("scheduledById") REFERENCES users(id) ON DELETE SET NULL
);


-- ============================================================
-- 16. INDEX DE PERFORMANCE
-- ============================================================

-- Users
CREATE INDEX IF NOT EXISTS idx_users_role     ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_sectorid ON users("sectorId");

-- Payments
CREATE INDEX IF NOT EXISTS idx_payments_status        ON payments(status);
CREATE INDEX IF NOT EXISTS idx_payments_referenceid   ON payments("referenceId");
CREATE INDEX IF NOT EXISTS idx_payments_provider_txid ON payments("providerTransactionId");

-- Products
CREATE INDEX IF NOT EXISTS idx_products_isactive  ON products("isActive");
CREATE INDEX IF NOT EXISTS idx_products_sectorid  ON products("sectorId");

-- Promotions
CREATE INDEX IF NOT EXISTS idx_promotions_isactive ON promotions("isActive");

-- Orders
CREATE INDEX IF NOT EXISTS idx_orders_userid ON orders("userId");
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);

-- C'Express
CREATE INDEX IF NOT EXISTS idx_deliveries_userid    ON c_express_deliveries("userId");
CREATE INDEX IF NOT EXISTS idx_deliveries_status    ON c_express_deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_courierid ON c_express_deliveries("courierId");
CREATE INDEX IF NOT EXISTS idx_couriers_phone       ON c_express_couriers(phone);
CREATE INDEX IF NOT EXISTS idx_couriers_available   ON c_express_couriers(available);
CREATE INDEX IF NOT EXISTS idx_import_export_userid ON c_express_import_export("userId");
CREATE INDEX IF NOT EXISTS idx_import_export_status ON c_express_import_export(status);

-- C'Clean
CREATE INDEX IF NOT EXISTS idx_clean_bookings_status ON clean_bookings(status);

-- C'Grill
CREATE INDEX IF NOT EXISTS idx_grill_orders_status ON grill_orders(status);

-- C'Todo
CREATE INDEX IF NOT EXISTS idx_todo_orders_userid ON todo_orders("userId");
CREATE INDEX IF NOT EXISTS idx_todo_orders_status ON todo_orders(status);

-- Planning
CREATE INDEX IF NOT EXISTS idx_employee_avail_employeeid  ON employee_availabilities("employeeId");
CREATE INDEX IF NOT EXISTS idx_employee_avail_date        ON employee_availabilities(date);
CREATE INDEX IF NOT EXISTS idx_mission_schedules_employee ON mission_schedules("employeeId");
CREATE INDEX IF NOT EXISTS idx_mission_schedules_date     ON mission_schedules(date);

-- Notifications
CREATE INDEX IF NOT EXISTS idx_notifications_userid ON notifications("userId");

-- Tasks
CREATE INDEX IF NOT EXISTS idx_tasks_assignedtoid ON tasks("assignedToId");
CREATE INDEX IF NOT EXISTS idx_tasks_status       ON tasks(status);


-- ============================================================
-- FIN DE LA MIGRATION
-- ============================================================
-- Tables créées / vérifiées :
--   sectors, roles, platform_settings, news_messages,
--   seasonal_campaigns, clean_services, relay_points,
--   grill_products, grill_menu_packs, grill_menu_pack_items,
--   todo_services, events, c_express_couriers,
--   clean_quotes, clean_reviews,
--   profile, users, user_roles,
--   payments,
--   products, promotions, promotion_products, product_reviews,
--   carts, cart_items,
--   orders, order_items, order_assignees  ← [NOUVEAU]
--   c_express_deliveries, c_express_import_export,
--   clean_bookings, todo_orders,
--   grill_orders, grill_order_items,
--   event_bookings,
--   tasks, notifications,
--   employee_availabilities,              ← [NOUVEAU]
--   mission_schedules                     ← [NOUVEAU]
--
-- Total : 41 tables + 3 tables de jointure = 44 objets tables
-- ============================================================
