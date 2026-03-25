# Système de Paiement — C'EMPIRE

> `backend/src/core/payments/` · Multi-provider · Webhooks · Événements

## Table des matières

1. [Vue d'ensemble](#vue-densemble)
2. [Entité Payment](#entité-payment)
3. [Enums](#enums)
4. [Service principal](#service-principal)
5. [Providers de paiement](#providers-de-paiement)
6. [Webhooks](#webhooks)
7. [Événement payment.success](#événement-paymentsuccess)
8. [Routes API](#routes-api)

---

## Vue d'ensemble

Le module de paiement supporte **plusieurs fournisseurs** et est utilisé par tous les modules métier (Shop, Grill, Express, Clean, Events, Todo). Il fonctionne par **événements** : quand un paiement est confirmé, un événement `payment.success` est émis et les modules abonnés mettent à jour leurs commandes.

```
Client ──► POST /api/payments/init
              │
              ▼
         PaymentsService
              │
              ├── Stripe   (carte bancaire internationale)
              ├── PayPal   (PayPal)
              ├── MTN MoMo (Mobile Money MTN)
              ├── Orange Money
              ├── Wave
              └── Wallet   (portefeuille interne)
              │
              ▼
         Payment (DB) [status: PENDING]
              │
              ▼
         Client redirigé vers URL de paiement
              │
              ▼ (après paiement)
         Webhook reçu (POST /api/payments/webhook/:provider)
              │
              ▼
         Payment [status: SUCCESS]
              │
              ▼
         emit('payment.success')
              │
       ┌──────┴──────┬──────────┬──────────┐
       ▼             ▼          ▼          ▼
  OrderService  GrillOrders  Clean     Events
  (isPaid=true) (confirmed)  (confirmed) (validated)
```

---

## Entité Payment

**Fichier** : `backend/src/core/payments/entities/payment.entity.ts`

| Colonne | Type | Description |
|---------|------|-------------|
| `id` | UUID | Clé primaire |
| `userId` | UUID | Utilisateur ayant initié le paiement |
| `amount` | decimal | Montant en centimes/unités |
| `currency` | string | Devise (`XAF`, `EUR`, `USD`) |
| `provider` | enum | Fournisseur de paiement |
| `status` | enum | Statut du paiement |
| `referenceType` | enum | Type de référence (commande, livraison, etc.) |
| `referenceId` | UUID | ID de l'entité liée (orderId, bookingId...) |
| `providerTransactionId` | string (nullable) | ID retourné par le fournisseur |
| `providerPaymentUrl` | string (nullable) | URL de paiement retournée |
| `metadata` | JSON (nullable) | Données supplémentaires du provider |
| `webhookReceivedAt` | Date (nullable) | Date de réception du webhook |
| `createdAt` | Date | Date de création |
| `updatedAt` | Date | Dernière modification |

---

## Enums

### `PaymentStatus`

```typescript
export enum PaymentStatus {
  PENDING   = 'pending',    // Initié, en attente de confirmation
  SUCCESS   = 'success',    // Paiement confirmé
  FAILED    = 'failed',     // Paiement échoué
  CANCELLED = 'cancelled',  // Annulé par l'utilisateur
}
```

### `PaymentProvider`

```typescript
export enum PaymentProvider {
  STRIPE      = 'stripe',       // Carte bancaire (Stripe)
  PAYPAL      = 'paypal',       // PayPal
  CARD        = 'card',         // Carte générique (mock)
  WALLET      = 'wallet',       // Portefeuille interne
  ORANGE_MONEY = 'orange_money', // Orange Money
  MTN_MOMO    = 'mtn_momo',     // MTN Mobile Money
  WAVE        = 'wave',         // Wave
}
```

### `PaymentReferenceType`

```typescript
export enum PaymentReferenceType {
  SHOP_ORDER     = 'shop_order',     // Commande C'Shop
  GRILL_ORDER    = 'grill_order',    // Commande C'Grill
  CLEAN_BOOKING  = 'clean_booking',  // Réservation C'Clean
  EVENT_BOOKING  = 'event_booking',  // Réservation C'Events
  TODO_ORDER     = 'todo_order',     // Commande C'Todo
  DELIVERY       = 'delivery',       // Livraison C'Express
  IMPORT_EXPORT  = 'import_export',  // Import/Export C'Express
}
```

---

## Service principal

**Fichier** : `backend/src/core/payments/payments.service.ts`

### `initPayment(payload: InitPaymentDto): Promise<PaymentInitResponse>`

Point d'entrée principal pour initier un paiement.

```typescript
async initPayment(payload) {
  // 1. Vérifie que le provider mock est autorisé si ALLOW_MOCK_PAYMENTS=false
  this.ensureMockPaymentsAllowed(payload.provider);

  // 2. Récupère le bon provider (Stripe, MTN, Orange, Wave, etc.)
  const provider = this.getProvider(payload.provider);

  // 3. Délègue au provider spécifique
  const result = await provider.initiate({
    amount: payload.amount,
    currency: payload.currency,
    referenceId: payload.referenceId,
    metadata: payload.metadata,
  });
  // result = { providerTransactionId, paymentUrl }

  // 4. Crée l'enregistrement Payment en base
  const payment = await this.paymentRepository.save({
    userId: payload.userId,
    amount: payload.amount,
    currency: payload.currency,
    provider: payload.provider,
    status: PaymentStatus.PENDING,
    referenceType: payload.referenceType,
    referenceId: payload.referenceId,
    providerTransactionId: result.providerTransactionId,
    providerPaymentUrl: result.paymentUrl,
  });

  // 5. Retourne l'URL de paiement et l'ID du payment
  return {
    paymentId: payment.id,
    paymentUrl: result.paymentUrl,
    provider: payload.provider,
    status: payment.status,
  };
}
```

### `handleWebhook(provider, payload, rawBody): Promise<void>`

Reçoit la confirmation d'un paiement du fournisseur.

```typescript
async handleWebhook(provider, payload, rawBody) {
  // 1. Vérifie la signature du webhook (sécurité critique)
  const webhookProvider = this.getProvider(provider);
  await webhookProvider.verifyWebhook(rawBody, payload.headers);

  // 2. Extrait l'ID de transaction et le statut
  const { transactionId, isSuccess } = webhookProvider.parseWebhook(payload.body);

  // 3. Trouve le paiement en base
  const payment = await this.findByTransactionId(transactionId);

  // 4. Met à jour le statut
  payment.status = isSuccess ? PaymentStatus.SUCCESS : PaymentStatus.FAILED;
  payment.webhookReceivedAt = new Date();
  await this.paymentRepository.save(payment);

  // 5. Si succès : émet l'événement pour les modules abonnés
  if (isSuccess) {
    this.eventEmitter.emit('payment.success', {
      paymentId: payment.id,
      referenceType: payment.referenceType,
      referenceId: payment.referenceId,
      userId: payment.userId,
      amount: payment.amount,
    });
  }
}
```

### `findById(id): Promise<Payment>`
Récupère un paiement par son ID.

### `getProvider(provider): IPaymentProvider`
Méthode privée qui retourne l'instance du bon provider :

```typescript
private getProvider(provider: PaymentProvider): IPaymentProvider {
  switch (provider) {
    case PaymentProvider.STRIPE:       return this.stripeProvider;
    case PaymentProvider.MTN_MOMO:     return this.mobileMomoProvider;
    case PaymentProvider.ORANGE_MONEY: return this.mobileMomoProvider;
    case PaymentProvider.WAVE:         return this.mobileMomoProvider;
    case PaymentProvider.PAYPAL:       return this.paypalProvider;
    case PaymentProvider.WALLET:       return this.walletProvider;
    case PaymentProvider.CARD:         return this.cardProvider;
    default: throw new BadRequestException(`Provider inconnu: ${provider}`);
  }
}
```

### `ensureMockPaymentsAllowed(provider)`
En production (`ALLOW_MOCK_PAYMENTS=false`), rejette les providers mock (`CARD`, `WALLET`).

---

## Providers de paiement

### Interface commune `IPaymentProvider`

Tous les providers implémentent cette interface :

```typescript
interface IPaymentProvider {
  // Initie un paiement, retourne l'URL de paiement et l'ID transaction
  initiate(payload: PaymentInitPayload): Promise<PaymentInitResult>;

  // Vérifie la signature du webhook (évite les faux webhooks)
  verifyWebhook(rawBody: Buffer, headers: Record<string, string>): Promise<void>;

  // Parse le payload du webhook pour extraire le statut
  parseWebhook(body: any): { transactionId: string; isSuccess: boolean };
}
```

### `StripeProvider` — `payments/providers/stripe.provider.ts`

```typescript
// Initiation : crée un Stripe Payment Intent ou Session
async initiate(payload) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: payload.currency.toLowerCase(),
        unit_amount: payload.amount,        // En centimes
        product_data: { name: 'C\'EMPIRE' }
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${APP_BASE_URL}/payments/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${APP_BASE_URL}/payments/cancel`,
  });
  return { providerTransactionId: session.id, paymentUrl: session.url };
}

// Webhook : vérifie la signature HMAC Stripe
async verifyWebhook(rawBody, headers) {
  stripe.webhooks.constructEvent(rawBody, headers['stripe-signature'], STRIPE_WEBHOOK_SECRET);
}
```

### `MobileMoneyProvider` — `payments/providers/mobile-money.provider.ts`

Gère Orange Money, MTN MoMo, et Wave.

```typescript
async initiate(payload) {
  // Appelle l'API du provider mobile money
  // Retourne une URL de paiement ou un USSD code
  const response = await mobileMoneyClient.createPayment({
    amount: payload.amount,
    phone: payload.metadata?.phone,
    reference: payload.referenceId,
  });
  return { providerTransactionId: response.transactionId, paymentUrl: response.url };
}
```

### `WalletProvider` — `payments/providers/wallet.provider.ts`

Portefeuille interne C'EMPIRE. Déduit le montant du solde utilisateur.

### `CardProvider` — `payments/providers/card.provider.ts`

Provider générique pour les tests (mock). Simule un paiement accepté immédiatement.

### `PaypalProvider` — `payments/providers/paypal.provider.ts`

Intégration PayPal via l'API REST PayPal.

---

## Webhooks

Les webhooks sont des appels HTTP envoyés par les providers de paiement pour confirmer un paiement. C'est le mécanisme principal de confirmation.

### Pourquoi les webhooks ?

Le client peut fermer le navigateur après paiement. Sans webhook, la commande ne serait jamais confirmée. Les providers envoient une requête HTTP vers notre serveur dès que le paiement est traité.

### Sécurité des webhooks

Le corps brut (`rawBody`) est conservé dans `main.ts` :
```typescript
express.json({
  verify: (req, res, buf) => {
    req.rawBody = Buffer.from(buf); // Nécessaire pour vérifier la signature HMAC
  }
})
```

La signature est vérifiée avant tout traitement :
```
STRIPE_WEBHOOK_SECRET  → Variable d'environnement
MTN_WEBHOOK_SECRET     → Variable d'environnement
ORANGE_WEBHOOK_SECRET  → Variable d'environnement
PAYMENT_WEBHOOK_SECRET → Variable générique
```

### Route webhook

```
POST /api/payments/webhook/:provider
```

Exemple : `POST /api/payments/webhook/stripe`

Cette route est `@Public()` car elle est appelée par le provider externe (pas par l'utilisateur).

---

## Événement `payment.success`

Quand un paiement est confirmé, un événement est émis via `EventEmitter2` :

```typescript
this.eventEmitter.emit('payment.success', {
  paymentId: string,        // ID du paiement
  referenceType: string,    // 'shop_order' | 'grill_order' | ...
  referenceId: string,      // ID de la commande
  userId: string,           // ID du client
  amount: number,           // Montant payé
});
```

### Modules abonnés

| Module | Listener | Action |
|--------|---------|--------|
| `OrderService` (Shop) | `@OnEvent('payment.success')` | `order.isPaid = true`, `status = PROCESSING` |
| `GrillOrdersService` | `@OnEvent('payment.success')` | `grillOrder.isPaid = true`, notif |
| `CleanBookingsService` | `@OnEvent('payment.success')` | `booking.status = CONFIRMED` |
| `EventBookingService` | `@OnEvent('payment.success')` | `booking.status = CONFIRMED` |
| `DeliveryService` | `@OnEvent('payment.success')` | `delivery.paid = true` |

Exemple dans `OrderService` :
```typescript
@OnEvent('payment.success')
async handlePaymentSuccess(event: PaymentSuccessEvent) {
  if (event.referenceType !== PaymentReferenceType.SHOP_ORDER) return;

  const order = await this.orderRepository.findOne({
    where: { id: event.referenceId }
  });

  if (!order) return;

  order.isPaid = true;
  order.paymentId = event.paymentId;
  order.status = OrderStatus.PROCESSING;
  await this.orderRepository.save(order);
}
```

---

## Routes API

### `POST /api/payments/init`

**Corps** :
```json
{
  "provider": "stripe",
  "amount": 25000,
  "currency": "XAF",
  "referenceType": "shop_order",
  "referenceId": "uuid-de-la-commande"
}
```

**Réponse** :
```json
{
  "paymentId": "uuid-du-paiement",
  "paymentUrl": "https://checkout.stripe.com/c/pay/...",
  "provider": "stripe",
  "status": "pending"
}
```

### `POST /api/payments/webhook/:provider`

Appelé par le provider (Stripe, MTN, etc.), pas par le frontend.

**Header Stripe** : `stripe-signature: t=...,v1=...`

### `GET /api/payments/:id`

Récupère les informations d'un paiement (auth requis).

---

## Configuration requise

```env
# Stripe
STRIPE_SECRET_KEY=sk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# MTN / Orange / Wave (si activés)
MTN_WEBHOOK_SECRET=...
ORANGE_WEBHOOK_SECRET=...

# Général
PAYMENT_WEBHOOK_STRICT=true    # En prod : true (rejette les webhooks sans signature)
ALLOW_MOCK_PAYMENTS=false      # En prod : false (bloque card et wallet)
PAYMENT_WEBHOOK_SECRET=...
```

---

*Voir aussi :*
- *[03-module-cshop.md](03-module-cshop.md) — Commandes shop et flux de paiement*
- *[01-architecture-backend.md](01-architecture-backend.md) — Événements et EventEmitter*
