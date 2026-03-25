# Modules Métier Frontend — C'EMPIRE

> Pages et composants de chaque service

## Page d'accueil — `features/home/`

**Composant** : `home.component.ts`
**Route** : `/`

La page d'accueil présente tous les services C'EMPIRE.

### Contenu affiché

```
1. Section héros avec carousel automatique (photos + CTA)
2. Grille des 6 services (C'Shop, C'Grill, etc.) avec animations
3. Campagnes promotionnelles en cours (chargées depuis l'API)
4. Actualités récentes (news_messages)
5. Statistiques de la plateforme
6. Témoignages / avis
7. Footer
```

### State (Signals)

```typescript
export class HomeComponent {
  private highlightsService = inject(HighlightsService);

  // Données chargées depuis l'API
  campaigns = signal<SeasonalCampaign[]>([]);
  news = signal<NewsMessage[]>([]);
  loading = signal(true);

  // Index du carousel courant
  currentSlide = signal(0);

  // Calculé automatiquement
  totalSlides = computed(() => this.campaigns().length);
}
```

---

## C'Shop — `features/shop/`

### `ProductListComponent` — `/shop`

**Fichier** : `features/shop/product-list/product-list.component.ts`

```typescript
export class ProductListComponent {
  // Filtres
  searchQuery = signal('');
  selectedCategory = signal<string | null>(null);

  // Données
  products = signal<Product[]>([]);
  loading = signal(true);

  // Dérivé
  filteredProducts = computed(() => {
    return this.products().filter(p =>
      (!this.selectedCategory() || p.category === this.selectedCategory()) &&
      (!this.searchQuery() || p.name.toLowerCase().includes(this.searchQuery().toLowerCase()))
    );
  });

  // Ajouter au panier
  addToCart(product: Product) {
    this.cartService.addItem(product.id, 1).subscribe({
      next: () => { /* toast succès */ },
      error: (err) => { /* message erreur */ }
    });
  }
}
```

### `ProductDetailComponent` — `/shop/product/:id`

Affiche le détail complet d'un produit :
- Images en galerie
- Description
- Prix et stock
- Bouton "Ajouter au panier"
- Section des avis

### `CartComponent` — `/shop/cart`

**Protégé par `AuthGuard`**

Affiche le panier avec :
- Liste des articles
- Modification des quantités
- Saisie d'un code promo
- Total (sous-total + livraison)
- Bouton "Procéder au paiement" → `/payments/checkout`

---

## Paiements — `features/payments/`

### `PaymentComponent` — `/payments/checkout`

**Fichier** : `features/payments/payment/payment.component.ts`
**Protégé par `AuthGuard`**

Le composant de paiement le plus complet de l'application.

```typescript
export class PaymentComponent {
  // Données du panier
  checkoutItems = signal<CartItem[]>([]);

  // Mode de livraison sélectionné
  selectedDeliveryMode = signal<DeliveryOption>(DeliveryOption.FREE);
  selectedRelayPointId = signal<string | null>(null);
  relayPoints = signal<RelayPoint[]>([]);

  // Code promo
  promoCode = signal('');
  promoDiscount = signal(0);

  // État
  loading = signal(false);
  error = signal<string | null>(null);
  success = signal(false);

  // Totaux calculés
  cartSubtotal = computed(() =>
    this.checkoutItems().reduce((sum, item) => sum + item.quantity * item.product.price, 0)
  );

  deliveryFee = computed(() => {
    switch (this.selectedDeliveryMode()) {
      case DeliveryOption.CEXPRESS:  return 7500;
      case DeliveryOption.FREE:      return 0;
      case DeliveryOption.RELAY:     return 0;
      case DeliveryOption.WAREHOUSE: return 0;
    }
  });

  totalAfterPromo = computed(() =>
    this.cartSubtotal() + this.deliveryFee() - this.promoDiscount()
  );

  // Validation
  canSubmit = computed(() =>
    this.checkoutItems().length > 0 &&
    !this.loading() &&
    (this.selectedDeliveryMode() !== DeliveryOption.RELAY || !!this.selectedRelayPointId())
  );
}
```

**Modes de livraison disponibles** :

```typescript
const deliveryModes = [
  { value: DeliveryOption.CEXPRESS,  label: "Livraison C'Express", fee: '~7 500 XAF', icon: 'local_shipping' },
  { value: DeliveryOption.FREE,      label: 'Livraison gratuite', fee: 'Gratuit', icon: 'card_giftcard' },
  { value: DeliveryOption.RELAY,     label: 'Point relais', fee: 'Gratuit', icon: 'store' },
  { value: DeliveryOption.WAREHOUSE, label: 'Retrait entrepôt', fee: 'Gratuit', icon: 'warehouse' },
];
```

**Sélection d'un point relais** : quand le mode RELAY est sélectionné, l'appel `GET /api/cshop/relay-points` est déclenché et les points relais s'affichent sous forme de cartes sélectionnables.

### `PaymentSuccessComponent` — `/payments/success`

Affiché après un paiement validé. Lit le `?session_id=` (Stripe) ou `?orderId=` dans l'URL et affiche la confirmation.

### `PaymentCancelComponent` — `/payments/cancel`

Affiché si l'utilisateur annule le paiement. Propose de retourner au panier.

---

## C'Grill — `features/grill/`

### `GrillPublicComponent` — `/grill`

Landing page avec :
- Menu des produits classés par catégorie (poisson, porc, poulet)
- Packs menus
- Bouton "Commander" → formulaire de commande

### Routes Grill

```typescript
export const GRILL_ROUTES: Routes = [
  { path: '', component: GrillPublicComponent },
  { path: 'checkout', component: GrillCheckoutComponent, canActivate: [AuthGuard] },
];
```

---

## C'Express — `features/express/`

### Composants

| Composant | Route | Description |
|-----------|-------|-------------|
| `ExpressPublicComponent` | `/express` | Landing page C'Express |
| `ExpressRequestComponent` | `/express/request` | Formulaire de demande de livraison |
| `ExpressMyDeliveriesComponent` | `/express/my-deliveries` | Suivi de mes livraisons |
| `ExpressImportExportRequestComponent` | `/express/import-export` | Formulaire import/export |
| `ExpressImportExportMyComponent` | `/express/import-export/my` | Mes dossiers I/E |
| `ExpressPaymentComponent` | `/express/payment` | Paiement d'une livraison |

---

## C'Clean — `features/clean/`

### Composants

| Composant | Route | Description |
|-----------|-------|-------------|
| `CleanPublicComponent` | `/clean` | Landing page C'Clean |
| `CleanBookingRequestComponent` | `/clean/booking` | Demande de réservation |
| `CleanBookingDetailComponent` | `/clean/booking/:id` | Détail d'une réservation |
| `CleanQuoteRequestComponent` | `/clean/quote` | Demande de devis |

---

## C'Events — `features/events/`

### Composants

| Composant | Route | Description |
|-----------|-------|-------------|
| `EventsPublicComponent` | `/events` | Liste des événements |
| (Booking components) | `/events/booking/:id` | Réserver un événement |

---

## C'Todo — `features/todo/`

### Composants

| Composant | Route | Description |
|-----------|-------|-------------|
| `TodoPublicComponent` | `/todo` | Liste des services à la demande |

---

## Profil utilisateur — `features/profile/`

**Route** : `/profile` (protégée par `AuthGuard`)

### `ProfileComponent`

```typescript
export class ProfileComponent {
  // Données du profil
  profile = signal<Profile | null>(null);
  editMode = signal(false);
  loading = signal(false);

  // Formulaire
  form = new FormGroup({
    firstname: new FormControl(''),
    lastname:  new FormControl(''),
    phone:     new FormControl(''),
    address:   new FormControl(''),
    city:      new FormControl(''),
    bio:       new FormControl(''),
  });

  // Onglets
  activeTab = signal<'profile' | 'orders' | 'bookings' | 'security'>('profile');
}
```

Sections disponibles :
- **Profil** : informations personnelles, photo
- **Commandes** : historique des commandes C'Shop
- **Réservations** : événements, nettoyage
- **Sécurité** : changement de mot de passe

---

## Espace Client — `features/client/`

**Route** : `/client` (protégée par `ClientGuard`)

### `ClientDashboardComponent` — `/client/dashboard`

Dashboard personnalisé du client avec :
- Résumé de l'activité (commandes, réservations)
- Liens rapides vers les services
- Notifications récentes

### `ClientEventsBookingsComponent` — `/client/events/bookings`

Liste des réservations d'événements du client avec statuts et possibilité d'annulation.

### `ClientTodoRequestsComponent` — `/client/todo/requests`

Liste des demandes de services à la demande.

---

## Espace Employé — `features/employee/`

**Route** : `/employee` (protégée par `EmployeeGuard`)

### `EmployeeDashboardComponent` — `/employee/dashboard`

Dashboard de l'employé affichant ses missions assignées.

### `EmployeeTodoMissionsComponent` — `/employee/todo-missions`

Liste des missions C'Todo assignées à l'employé connecté.

---

## Pages de contenu — `features/content/`

### `ContentPageComponent`

Composant générique qui charge et affiche une page depuis le CMS.

```typescript
export class ContentPageComponent {
  // Le slug est passé via data de la route
  // { path: 'a-propos', component: ContentPageComponent, data: { slug: 'a-propos' } }
  slug = inject(ActivatedRoute).snapshot.data['slug'];

  content = signal<ContentPage | null>(null);

  ngOnInit() {
    this.contentPagesService.getPublicPage(this.slug).subscribe({
      next: (page) => this.content.set(page),
      error: () => { /* Page non trouvée */ }
    });
  }
}
```

**Pages disponibles** :
- `/a-propos` → slug: `a-propos`
- `/nos-missions` → slug: `nos-missions`
- `/faq` → slug: `faq`
- `/politique-confidentialite` → slug: `politique-confidentialite`
- `/politique-cookies` → slug: `politique-cookies`
- `/devenir-partenaire` → slug: `devenir-partenaire`
- `/partenaires-confiance` → slug: `partenaires-confiance`
- `/careers` → slug: `careers`
