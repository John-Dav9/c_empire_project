# Services Core Frontend — C'EMPIRE

> `frontend/src/app/core/services/` · Services singleton Angular

## `ApiService` — Service HTTP générique

**Fichier** : `frontend/src/app/core/services/api.service.ts`

Wrapper autour de `HttpClient` qui préfixe toutes les URL avec `API_BASE_URL`.

```typescript
@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);

  get<T>(endpoint: string, params?: Record<string, string>): Observable<T> {
    return this.http.get<T>(buildApiUrl(endpoint), { params });
  }

  post<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.post<T>(buildApiUrl(endpoint), body);
  }

  put<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.put<T>(buildApiUrl(endpoint), body);
  }

  patch<T>(endpoint: string, body: unknown): Observable<T> {
    return this.http.patch<T>(buildApiUrl(endpoint), body);
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(buildApiUrl(endpoint));
  }
}

// Utilisation dans un composant :
const products = await this.apiService.get<Product[]>('/cshop/products').toPromise();
```

---

## `PaymentService` — Paiements

**Fichier** : `frontend/src/app/core/services/payment.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class PaymentService {
  private http = inject(HttpClient);

  // Initie un paiement → retourne l'URL du provider
  initPayment(request: InitPaymentRequest): Observable<PaymentInitResponse> {
    return this.http.post<PaymentInitResponse>(buildApiUrl('/payments/init'), request);
  }
  // InitPaymentRequest = { provider, amount, currency, referenceType, referenceId }
  // PaymentInitResponse = { paymentId, paymentUrl, provider, status }

  // Vérifie le statut d'un paiement
  verifyPayment(providerTransactionId: string): Observable<PaymentVerifyResponse> {
    return this.http.post<PaymentVerifyResponse>(
      buildApiUrl('/payments/verify'), { providerTransactionId }
    );
  }
}
```

---

## `ShopCartService` — Panier d'achat

**Fichier** : `frontend/src/app/core/services/shop-cart.service.ts`

Gère le panier côté client (synchronisé avec le backend).

```typescript
@Injectable({ providedIn: 'root' })
export class ShopCartService {
  // Signal du nombre d'articles dans le panier
  readonly cartCount = signal(0);

  // Charge le panier depuis le backend
  loadCart(): Observable<Cart> { ... }

  // Ajoute un article
  addItem(productId: string, quantity: number): Observable<Cart> { ... }

  // Met à jour la quantité
  updateItem(cartItemId: string, quantity: number): Observable<Cart> { ... }

  // Retire un article
  removeItem(cartItemId: string): Observable<Cart> { ... }

  // Vide le panier
  clearCart(): Observable<void> { ... }

  // Récupère le total calculé
  getTotal(): Observable<{ subtotal: number; itemCount: number }> { ... }
}
```

---

## `ContentPagesService` — Pages CMS

**Fichier** : `frontend/src/app/core/services/content-pages.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class ContentPagesService {
  // Récupère une page publiée par son slug
  getPublicPage(slug: string): Observable<ContentPage> {
    return this.http.get<ContentPage>(buildApiUrl(`/settings/content-pages/${slug}`));
  }
  // Utilisé par ContentPageComponent pour les pages : a-propos, faq, etc.
}
```

---

## `FooterConfigService` — Configuration du footer

**Fichier** : `frontend/src/app/core/services/footer-config.service.ts`

```typescript
@Injectable({ providedIn: 'root' })
export class FooterConfigService {
  // Charge la configuration du footer depuis l'API ou utilise les defaults
  getFooterConfig(): Observable<FooterConfig> { ... }
}
```

---

## Pipes partagés

### `CurrencyXafPipe` — `shared/pipes/currency-xaf.pipe.ts`

Formate un montant en francs CFA (XAF).

```typescript
@Pipe({ name: 'currencyXaf' })
export class CurrencyXafPipe implements PipeTransform {
  transform(value: number | null | undefined): string {
    if (value == null) return '—';
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XAF',
      minimumFractionDigits: 0,
    }).format(value);
    // Exemple : 25000 → "25 000 XAF"
  }
}
```

### `StatusLabelPipe` — `shared/pipes/status-label.pipe.ts`

Convertit les valeurs d'enum en labels lisibles.

```typescript
@Pipe({ name: 'statusLabel' })
export class StatusLabelPipe implements PipeTransform {
  transform(value: string, type?: string): string {
    // 'pending' → 'En attente'
    // 'processing' → 'En cours'
    // 'delivered' → 'Livré'
    // etc.
  }
}
```

---

## Composants partagés

### `LayoutComponent` — `shared/layout/layout.component.ts`

Shell principal de l'application. Contient :
- Le header avec la navigation
- Le `<router-outlet>` pour les pages
- Le footer

```typescript
// Champ de recherche, menu mobile, état connexion
export class LayoutComponent {
  private authService = inject(AuthService);
  currentUser = toSignal(authService.currentUser$);
  isMenuOpen = signal(false);
}
```

### `StatusBadgeComponent` — `shared/ui/status-badge/`

Affiche un badge coloré selon le statut.

```html
<!-- Usage -->
<app-status-badge [status]="order.status" />
<!-- Résultat : badge vert "Livré", badge orange "En cours", etc. -->
```

### `StatCardComponent` — `shared/ui/stat-card/`

Carte de statistique pour les dashboards.

```html
<!-- Usage -->
<app-stat-card
  label="Commandes ce mois"
  [value]="42"
  icon="shopping_cart"
  color="primary"
/>
```

### `PageHeaderComponent` — `shared/ui/page-header/`

En-tête standardisé pour les pages avec titre et fil d'Ariane.

```html
<!-- Usage -->
<app-page-header
  title="Gestion des produits"
  [breadcrumbs]="[{ label: 'Admin', link: '/admin' }, { label: 'Produits' }]"
/>
```

### `NotFoundComponent` — `shared/not-found/`

Page 404 avec lien de retour à l'accueil.

---

## Modèles partagés

### `FooterConfig` — `shared/footer/footer-config.model.ts`

```typescript
interface FooterConfig {
  companyName: string;
  description: string;
  socialLinks: { platform: string; url: string; icon: string }[];
  quickLinks: { label: string; path: string }[];
  services: { label: string; path: string }[];
  contact: { email: string; phone: string; address: string };
  copyright: string;
}
```
