# Interface Super Admin — C'EMPIRE

> `frontend/src/app/features/super-admin/` · Back-office complet

## Vue d'ensemble

L'espace super admin est le back-office principal de la plateforme. Il est accessible uniquement aux utilisateurs avec le rôle `super_admin`.

**Route** : `/super-admin` → protégée par `SuperAdminGuard`

## Layout

### `AdminLayoutComponent` — `super-admin/layout/admin-layout.component.ts`

Le layout de l'espace super admin comprend :
- Sidebar de navigation (collapsible sur desktop, tiroir sur mobile)
- Header sticky sur mobile avec bouton hamburger
- Overlay backdrop sur mobile (ferme la sidebar au clic)
- Zone de contenu principale (`<router-outlet>`)

#### Comportement responsive

**Desktop (≥ 768px)** :
- Sidebar fixe à gauche (280px, ou 64px en mode collapsed)
- Le contenu principal ajuste son `margin-left` dynamiquement via une CSS custom property `--sidebar-width`
- Bouton `←` / `→` pour réduire/étendre la sidebar

**Mobile (< 768px)** :
- La sidebar est **cachée par défaut** (`transform: translateX(-100%)`)
- Un header sticky de 56px apparaît en haut avec le bouton ☰
- Clic sur ☰ → la sidebar s'ouvre en superposition (slide-in)
- Un overlay semi-transparent permet de fermer la sidebar en cliquant à côté
- Chaque lien de navigation ferme automatiquement la sidebar

**State** :
```typescript
readonly mobileMenuOpen = signal(false);

toggleMobileMenu(): void {
  this.mobileMenuOpen.update((v) => !v);
}

closeMobileMenu(): void {
  this.mobileMenuOpen.set(false);
}
```

**Classes CSS** :
```html
<!-- Overlay backdrop -->
<div class="mobile-overlay" [class.show]="mobileMenuOpen()" (click)="closeMobileMenu()"></div>

<!-- Header mobile -->
<header class="mobile-header">
  <button (click)="toggleMobileMenu()">{{ mobileMenuOpen() ? '✕' : '☰' }}</button>
  <span>C'EMPIRE Admin</span>
</header>

<!-- Sidebar avec classe conditionnelle -->
<aside class="sidebar" [class.mobile-open]="mobileMenuOpen()">...</aside>
```

**Navigation** :
```
Dashboard
├── Utilisateurs
│   ├── Tous les utilisateurs
│   ├── Clients
│   └── Employés
├── C'Shop
│   ├── Produits
│   └── Promotions
├── C'Grill
│   ├── Produits
│   └── Menus/Packs
├── C'Clean
│   └── Services
├── C'Express
│   ├── Livraisons
│   ├── Coursiers
│   └── Import/Export
├── C'Events
│   ├── Événements
│   └── Réservations
├── C'Todo
│   └── Services
├── Missions
├── Commandes
├── Marketing
│   ├── Actualités
│   ├── Campagnes
│   ├── Pages de contenu
│   └── Footer
└── Secteurs
```

---

## Dashboard

### `SuperAdminDashboardComponent` — `/super-admin/dashboard`

**Fichier** : `super-admin/dashboard/super-admin-dashboard.component.ts`

Affiche :
- **KPIs** : nombre d'utilisateurs, commandes, revenus, réservations
- **Graphiques** : évolution des commandes, revenus par service
- **Dernières activités** : commandes récentes, nouveaux inscrits
- **Alertes** : stock bas, commandes en attente

```typescript
export class SuperAdminDashboardComponent {
  stats = signal<DashboardStats | null>(null);
  recentOrders = signal<Order[]>([]);
  recentUsers = signal<User[]>([]);
  loading = signal(true);

  // Stats calculées
  totalRevenue = computed(() => this.stats()?.totalRevenue ?? 0);
  pendingOrders = computed(() => this.stats()?.pendingOrders ?? 0);
}
```

---

## Gestion des utilisateurs

### `UsersManagementComponent` — `/super-admin/users`

**Fichier** : `super-admin/users/users-management.component.ts`

Tableau de tous les utilisateurs avec :
- Recherche par email/nom
- Filtres par rôle, statut
- Pagination
- Actions : modifier le rôle, activer/désactiver

```typescript
export class UsersManagementComponent {
  users = signal<User[]>([]);
  filters = signal({ search: '', role: '', isActive: '' });
  pagination = signal({ page: 1, limit: 20, total: 0 });

  // Modifie le rôle d'un utilisateur
  updateRole(userId: string, newRole: string) { ... }

  // Active/désactive un compte
  toggleStatus(userId: string, isActive: boolean) { ... }
}
```

### `ClientsManagementComponent` — `/super-admin/clients`

Vue filtrée sur les utilisateurs avec rôle `client`.

### `EmployeesManagementComponent` — `/super-admin/employees`

Vue filtrée sur les utilisateurs avec rôle `employee`, avec affichage de la `specialty`.

---

## Gestion C'Shop

### `ShopProductsComponent` — `/super-admin/shop/products`

**Fichier** : `super-admin/shop/shop-products.component.ts`

CRUD complet des produits :
- Tableau avec image, nom, prix, stock
- Formulaire de création/modification (dans un dialog ou panneau latéral)
- Upload d'images
- Gestion du stock

### `ShopPromotionsComponent` — `/super-admin/shop/promotions`

**Fichier** : `super-admin/shop/shop-promotions.component.ts`

Gestion des codes promo :
- Création avec type PERCENT/FIXED
- Définition des limites (maxUses, expiresAt, minOrderAmount)
- Activation/désactivation

---

## Gestion C'Grill

### `GrillProductsComponent` — `/super-admin/grill/products`

CRUD des plats (avec catégories : poisson, porc, poulet, menu).

### `GrillMenusComponent` — `/super-admin/grill/menus`

CRUD des packs menus (combinaison de produits à prix fixe).

---

## Gestion C'Clean

### `CleanServicesComponent` — `/super-admin/clean/services`

CRUD des types de services nettoyage (titre, tarif, unité).

---

## Gestion C'Express

### `ExpressDeliveriesManagementComponent` — `/super-admin/express/deliveries`

Gestion de toutes les livraisons :
- Tableau avec statut, adresses, coursier assigné
- Assignation d'un coursier
- Changement de statut (PENDING → ASSIGNED → PICKED → DELIVERED)

### `ExpressCouriersManagementComponent` — `/super-admin/express/couriers`

Gestion des livreurs :
- Liste avec disponibilité, véhicule, note
- Création de profils livreurs

### `ExpressImportExportManagementComponent` — `/super-admin/express/import-export`

Gestion des dossiers import/export :
- Vue des dossiers en cours
- Définition des prix
- Changement de statut

---

## Gestion C'Events

### `EventsManagementComponent` — `/super-admin/events/catalog`

CRUD des événements (titre, date, lieu, capacité, tarif).

### `EventsBookingsManagementComponent` — `/super-admin/events/bookings`

Gestion des réservations :
- Liste avec statut (PENDING → CONFIRMED → CANCELLED)
- Validation des réservations après paiement

---

## Gestion C'Todo

### `TodoServicesComponent` — `/super-admin/todo/services`

CRUD des services à la demande.

---

## Missions — Tasks

### `TasksManagementComponent` — `/super-admin/tasks`

**Fichier** : `super-admin/tasks/tasks-management.component.ts`

Gestion centralisée des missions des employés :
- Vue de toutes les missions en cours
- Assignation à des employés
- Suivi de statut

---

## Suivi des commandes

### `OrdersTrackingComponent` — `/super-admin/orders`

**Fichier** : `super-admin/orders/orders-tracking.component.ts`

Vue globale de toutes les commandes C'Shop :
- Filtres par statut, date, client
- Actions : changer le statut, voir le détail
- Export CSV (si implémenté)

---

## Secteurs

### `SectorsComponent` — `/super-admin/sectors`

Gestion des secteurs d'activité (liaison avec les employés).

---

## Marketing & CMS

### `NewsManagementComponent` — `/super-admin/marketing/news`

**Fichier** : `super-admin/marketing/news-management.component.ts`

Gestion des actualités affichées sur la page d'accueil.

### `SeasonalCampaignsComponent` — `/super-admin/marketing/campaigns`

Campagnes promotionnelles avec dates de début/fin et images.

### `ContentPagesManagementComponent` — `/super-admin/marketing/pages`

Éditeur de pages statiques (a-propos, faq, etc.) avec contenu riche.

### `FooterSettingsComponent` — `/super-admin/marketing/footer`

Configuration du pied de page (liens, réseaux sociaux, contact).

---

## Composant générique CRUD

### `GenericCrudComponent` — `super-admin/shared/generic-crud.component.ts`

Composant de base réutilisable pour les interfaces CRUD standards.

```typescript
// Fonctionnalités :
// - Tableau Material avec tri et pagination
// - Formulaire dans un dialog Angular Material
// - Confirmation de suppression
// - Chargement et affichage des erreurs

export class GenericCrudComponent<T> {
  items = signal<T[]>([]);
  loading = signal(true);
  editItem = signal<T | null>(null);
  isDialogOpen = signal(false);

  openCreate() { this.editItem.set(null); this.isDialogOpen.set(true); }
  openEdit(item: T) { this.editItem.set(item); this.isDialogOpen.set(true); }
  closeDialog() { this.isDialogOpen.set(false); }

  save(data: Partial<T>) { ... }
  remove(id: string) { ... }
}
```

---

## Routes complètes super-admin

```typescript
export const superAdminRoutes: Routes = [
  {
    path: '',
    component: AdminLayoutComponent,
    canActivate: [SuperAdminGuard],
    children: [
      { path: 'dashboard',              component: SuperAdminDashboardComponent },
      { path: 'users',                  component: UsersManagementComponent },
      { path: 'clients',                component: ClientsManagementComponent },
      { path: 'employees',              component: EmployeesManagementComponent },
      { path: 'sectors',                component: SectorsComponent },
      { path: 'orders',                 component: OrdersTrackingComponent },
      { path: 'tasks',                  component: TasksManagementComponent },
      { path: 'shop/products',          component: ShopProductsComponent },
      { path: 'shop/promotions',        component: ShopPromotionsComponent },
      { path: 'grill/products',         component: GrillProductsComponent },
      { path: 'grill/menus',            component: GrillMenusComponent },
      { path: 'clean/services',         component: CleanServicesComponent },
      { path: 'express/deliveries',     component: ExpressDeliveriesManagementComponent },
      { path: 'express/couriers',       component: ExpressCouriersManagementComponent },
      { path: 'express/import-export',  component: ExpressImportExportManagementComponent },
      { path: 'events/catalog',         component: EventsManagementComponent },
      { path: 'events/bookings',        component: EventsBookingsManagementComponent },
      { path: 'todo/services',          component: TodoServicesComponent },
      { path: 'marketing/news',         component: NewsManagementComponent },
      { path: 'marketing/campaigns',    component: SeasonalCampaignsComponent },
      { path: 'marketing/pages',        component: ContentPagesManagementComponent },
      { path: 'marketing/footer',       component: FooterSettingsComponent },
      { path: '',                       redirectTo: 'dashboard', pathMatch: 'full' },
    ]
  }
];
```
