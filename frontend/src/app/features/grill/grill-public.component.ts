import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { ApiService } from '../../core/services/api.service';
import { buildMediaUrl } from '../../core/config/api.config';
import { CurrencyXafPipe } from '../../shared/pipes/currency-xaf.pipe';

type GrillItem = {
  id: string;
  kind: 'product' | 'pack';
  title: string;
  description?: string;
  category?: string;
  price: number;
  currency?: string;
  images?: string[];
  imageUrl?: string;
  isAvailable?: boolean;
  avgRating?: number;
  reviewsCount?: number;
};

type GrillPack = {
  id: string;
  title: string;
  description?: string;
  price: number;
  currency?: string;
  images?: string[];
  isAvailable?: boolean;
};

@Component({
  selector: 'app-grill-public',
  imports: [MatIconModule, RouterLink, FormsModule, DecimalPipe, CurrencyXafPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: { '(window:scroll)': 'onScroll()' },
  template: `
    <section class="grill-page page-enter">
      <header class="top-promo app-shell-card">
        <span><mat-icon>local_fire_department</mat-icon> Nouveau menu epice disponible</span>
        <span><mat-icon>delivery_dining</mat-icon> Livraison des 7 000 FCFA</span>
        <a [routerLink]="['/grill/checkout']">Commander maintenant ({{ cartCount() }})</a>
      </header>

      <nav class="grill-nav app-shell-card">
        <a href="#menu" [class.active]="currentSection() === 'menu'" (click)="scrollToSection($event, 'menu')">Notre menu</a>
        <a href="#offers" [class.active]="currentSection() === 'offers'" (click)="scrollToSection($event, 'offers')">Bons plans</a>
        <a href="#quality" [class.active]="currentSection() === 'quality'" (click)="scrollToSection($event, 'quality')">Qualite</a>
        <a href="#app" [class.active]="currentSection() === 'app'" (click)="scrollToSection($event, 'app')">L'app C'Empire</a>
        <a href="#contact" [class.active]="currentSection() === 'contact'" (click)="scrollToSection($event, 'contact')">Contact</a>
      </nav>

      @if (featuredItem(); as featured) {
        <section class="hero app-shell-card" id="offers">
          <div class="hero-copy">
            <p class="tag">C'Grill & Food</p>
            <h1>{{ featured.title }}</h1>
            <p>{{ featured.description || "Recette signature de C'Grill, preparee minute." }}</p>
            <div class="hero-meta">
              <strong>{{ featured.price | currencyXaf }}</strong>
              <span>{{ featured.category || (featured.kind === 'pack' ? 'Menu pack' : 'Menu signature') }}</span>
            </div>
            <div class="hero-actions">
              <button type="button" (click)="prevFeatured()" aria-label="Precedent">‹</button>
              <button type="button" (click)="nextFeatured()" aria-label="Suivant">›</button>
              <button type="button" (click)="addToCart(featured)">Ajouter au panier</button>
            </div>
          </div>
          <div class="hero-visual">
            @if (featured.imageUrl) {
              <img [src]="featured.imageUrl" [alt]="featured.title" />
            } @else {
              <div class="fallback hero-fallback">
                <mat-icon>restaurant</mat-icon>
                <span>Photo menu</span>
              </div>
            }
          </div>
        </section>
      } @else {
        <section class="hero app-shell-card">
          <div class="loading">Chargement des produits C'Grill...</div>
        </section>
      }

      <section class="quick-row">
        <article class="quick-card app-shell-card">
          <mat-icon>restaurant_menu</mat-icon>
          <h3>Menu iconique</h3>
          <p>Burgers, grillades, wraps et menus partages.</p>
        </article>
        <article class="quick-card app-shell-card">
          <mat-icon>bolt</mat-icon>
          <h3>Service rapide</h3>
          <p>Preparation optimisee pour repas sur place et livraison.</p>
        </article>
        <article class="quick-card app-shell-card">
          <mat-icon>verified</mat-icon>
          <h3>Qualite controlee</h3>
          <p>Ingredients traces et procedures hygiene renforcees.</p>
        </article>
      </section>

      <section class="menu-shell app-shell-card" id="menu">
        <div class="menu-head">
          <h2>Notre menu C'Grill</h2>
          <a [routerLink]="['/grill/checkout']">Voir mon panier grill ({{ cartCount() }})</a>
        </div>

        <div class="menu-filters">
          <input
            type="text"
            [ngModel]="searchTerm()"
            (ngModelChange)="searchTerm.set($event)"
            placeholder="Rechercher un menu ou une recette..."
          />
          <div class="chips">
            <button type="button" [class.active]="selectedCategory() === ''" (click)="selectedCategory.set('')">Tous</button>
            @for (category of categories(); track category) {
              <button
                type="button"
                [class.active]="selectedCategory() === category"
                (click)="selectedCategory.set(category)"
              >
                {{ category }}
              </button>
            }
          </div>
        </div>

        @if (error()) {
          <p class="error">{{ error() }}</p>
        }
        @if (notice()) {
          <p class="notice">{{ notice() }}</p>
        }
        @if (loading()) {
          <div class="loading">Chargement du catalogue grill...</div>
        }

        @if (!loading()) {
          <section class="grid">
            @for (item of filteredItems(); track item.id) {
              <article class="card">
                <div class="img">
                  @if (item.imageUrl) {
                    <img [src]="item.imageUrl" [alt]="item.title" (error)="onItemImageError(item.id)" />
                  } @else {
                    <div class="fallback">
                      <mat-icon>restaurant</mat-icon>
                      <span>Photo menu</span>
                    </div>
                  }
                  @if (item.isAvailable !== false) {
                    <span class="badge">Disponible</span>
                  } @else {
                    <span class="badge out">Indisponible</span>
                  }
                </div>
                <h3>{{ item.title }}</h3>
                <p>{{ item.description || "Menu du jour C'Grill." }}</p>
                <div class="meta">
                  <span>{{ item.category || (item.kind === 'pack' ? 'Pack menu' : 'Menu') }}</span>
                  <strong>{{ item.price | currencyXaf }}</strong>
                </div>
                @if ((item.reviewsCount || 0) > 0) {
                  <div class="rating">
                    <span class="stars">
                      @for (s of stars(item.avgRating || 0); track $index) {
                        <mat-icon>{{ s ? 'star' : 'star_border' }}</mat-icon>
                      }
                    </span>
                    <span class="score">{{ (item.avgRating || 0) | number:'1.1-1' }}/5</span>
                    <span class="count">({{ item.reviewsCount }} avis)</span>
                  </div>
                } @else {
                  <p class="no-rating">Pas encore note</p>
                }
                <div class="actions">
                  <button type="button" (click)="addToCart(item)" [disabled]="item.isAvailable === false">Commander</button>
                </div>
              </article>
            }
          </section>
        }
      </section>

      <section class="quality app-shell-card" id="quality">
        <h2>Notre engagement qualite</h2>
        <div class="quality-grid">
          <article><mat-icon>eco</mat-icon><p>Selection de fournisseurs locaux quand possible.</p></article>
          <article><mat-icon>fact_check</mat-icon><p>Controle quotidien des temperatures et chaines froides.</p></article>
          <article><mat-icon>health_and_safety</mat-icon><p>Protocoles hygiene stricts en cuisine et en livraison.</p></article>
        </div>
      </section>

      <section class="app-block app-shell-card" id="app">
        <div>
          <h2>Telechargez l'app C'Empire</h2>
          <p>Accedez aux offres exclusives C'Grill, suivez vos commandes et gagnez des avantages.</p>
        </div>
        <div class="app-actions">
          <a href="#">App Store</a>
          <a href="#">Google Play</a>
        </div>
      </section>

      <section class="contact app-shell-card" id="contact">
        <h2>Une question sur un menu ou un evenement ?</h2>
        <p>Notre equipe C'Grill & Food vous repond rapidement.</p>
        <a [routerLink]="['/auth/signin']">Contacter C'Grill</a>
      </section>
    </section>
  `,
  styles: [
    `
      .grill-page { display:grid; gap:16px; }
      .top-promo { border:1px solid #f2c300; background:linear-gradient(120deg,#ffde33,#ffd013); border-radius:16px; padding:10px 14px; display:flex; flex-wrap:wrap; gap:10px 18px; align-items:center; color:#1e232b; font-weight:700; }
      .top-promo span { display:inline-flex; align-items:center; gap:6px; }
      .top-promo mat-icon { width:18px; height:18px; font-size:18px; color:#d20d1f; }
      .top-promo a { margin-left:auto; text-decoration:none; border-radius:999px; padding:8px 14px; border:1px solid #c90f1f; background:#d70016; color:#fff; font-weight:800; white-space:nowrap; }
      .grill-nav { border:1px solid var(--line); border-radius:16px; padding:10px 12px; display:flex; gap:8px; overflow-x:auto; scrollbar-width:none; background:#fff; }
      .grill-nav::-webkit-scrollbar { display:none; }
      .grill-nav a { text-decoration:none; color:#2e3340; font-weight:700; white-space:nowrap; border-radius:999px; padding:8px 12px; }
      .grill-nav a.active, .grill-nav a:hover { background:#fff3bf; color:#7d240f; }
      .hero { border:1px solid var(--line); border-radius:24px; overflow:hidden; display:grid; grid-template-columns:1fr 1fr; min-height:460px; background:#1d1f24; color:#fff; }
      .hero-copy { padding:34px; display:grid; align-content:center; gap:10px; background:radial-gradient(circle at 20% 20%,#383d48 0%,#21252d 55%,#181b22 100%); }
      .tag { margin:0; color:#ffd441; letter-spacing:.08em; text-transform:uppercase; font-size:.82rem; font-weight:800; }
      .hero h1 { margin:0; font-size:clamp(1.9rem,3.2vw,3.5rem); line-height:1.02; }
      .hero p { margin:0; color:#d5d8e0; line-height:1.4; }
      .hero-meta { display:flex; gap:10px; align-items:center; }
      .hero-meta strong { color:#ffd441; font-size:1.7rem; }
      .hero-meta span { color:#f2f4f8; background:rgba(255,255,255,.14); border:1px solid rgba(255,255,255,.2); padding:4px 8px; border-radius:999px; font-size:.8rem; font-weight:700; }
      .hero-actions { display:flex; align-items:center; gap:8px; margin-top:4px; }
      .hero-actions button { width:34px; height:34px; border-radius:50%; border:1px solid rgba(255,255,255,.3); background:rgba(255,255,255,.14); color:#fff; cursor:pointer; font-size:1.2rem; }
      .hero-actions button:last-child { width:auto; height:auto; border-radius:999px; padding:9px 14px; border:1px solid #c80f20; background:#d70016; font-weight:800; }
      .hero-visual { position:relative; }
      .hero-visual img { width:100%; height:100%; object-fit:cover; display:block; }
      .hero-fallback { height:100%; background:#2a2f39; color:#ffd441; }
      .quick-row { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
      .quick-card { border:1px solid #e5e8ef; border-radius:14px; background:#fff; padding:14px; display:grid; gap:7px; }
      .quick-card mat-icon { width:22px; height:22px; font-size:22px; color:#d70016; }
      .quick-card h3 { margin:0; font-size:1.08rem; color:#2f3440; }
      .quick-card p { margin:0; color:#5e6677; }
      .menu-shell { border:1px solid var(--line); border-radius:20px; padding:20px; display:grid; gap:12px; background:#fff; }
      .menu-head { display:flex; justify-content:space-between; align-items:center; gap:10px; }
      .menu-head h2 { margin:0; font-size:clamp(1.3rem,2vw,1.8rem); }
      .menu-head a { text-decoration:none; border-radius:999px; padding:9px 13px; border:1px solid #c90f1f; background:#d70016; color:#fff; font-weight:800; white-space:nowrap; }
      .menu-filters { display:grid; gap:10px; }
      .menu-filters input { height:42px; border:1px solid #dde2ed; border-radius:10px; padding:0 12px; background:#fff; color:#374153; }
      .chips { display:flex; gap:8px; flex-wrap:wrap; }
      .chips button { border:1px solid #dde2ed; border-radius:999px; padding:7px 11px; background:#fff; color:#3a4355; font-weight:700; cursor:pointer; }
      .chips button.active { border-color:#f2c300; background:#fff5cc; color:#7d240f; }
      .loading { color:var(--ink-2); font-weight:700; }
      .notice { background:#e8f8f0; border:1px solid #9ad5be; color:#0f6d5f; border-radius:12px; padding:10px 12px; }
      .grid { display:grid; grid-template-columns:repeat(auto-fill,minmax(250px,1fr)); gap:14px; }
      .card { border:1px solid #e0e6f0; border-radius:14px; padding:12px; display:grid; gap:10px; background:#fff; }
      .img { height:170px; border-radius:12px; overflow:hidden; background:#2a2f39; border:1px solid #dbe2ee; position:relative; }
      .img img { width:100%; height:100%; object-fit:cover; display:block; }
      .fallback { width:100%; height:100%; display:grid; place-items:center; color:#ffd441; font-weight:700; gap:6px; align-content:center; }
      .badge { position:absolute; top:8px; left:8px; border-radius:999px; padding:4px 8px; font-size:.72rem; font-weight:800; color:#fff; background:#148a3f; border:1px solid #0d6a2f; }
      .badge.out { background:#b73924; border-color:#8f2817; }
      .card h3 { margin:0; font-size:1.2rem; color:#2e3441; }
      .card p { margin:0; color:#606a7b; }
      .meta { display:flex; justify-content:space-between; align-items:center; }
      .meta span { font-size:.78rem; text-transform:uppercase; letter-spacing:.05em; color:#8d2b16; font-weight:700; }
      .meta strong { color:#c44a18; font-size:1.1rem; }
      .rating { display:flex; align-items:center; gap:6px; }
      .stars { display:inline-flex; align-items:center; gap:1px; }
      .stars mat-icon { width:16px; height:16px; font-size:16px; color:#d89b2c; }
      .score { font-size:.82rem; font-weight:700; color:#3a4458; }
      .count { font-size:.8rem; color:#657083; }
      .no-rating { margin:0; color:#657083; font-size:.82rem; }
      .actions { display:flex; justify-content:flex-end; border-top:1px solid #e0e6f0; padding-top:10px; }
      .actions button { border:none; text-decoration:none; padding:8px 13px; border-radius:10px; color:#fff; background:#d70016; border:1px solid #c90f1f; font-weight:800; cursor:pointer; }
      .actions button:disabled { opacity:.55; cursor:not-allowed; }
      .quality { border:1px solid var(--line); border-radius:20px; padding:18px; display:grid; gap:12px; background:linear-gradient(145deg,#fff,#fff8df); }
      .quality h2 { margin:0; font-size:clamp(1.3rem,2vw,1.8rem); }
      .quality-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; }
      .quality-grid article { border:1px solid #eadfa9; border-radius:12px; background:#fff; padding:12px; display:grid; gap:6px; }
      .quality-grid mat-icon { width:20px; height:20px; font-size:20px; color:#bf8b00; }
      .quality-grid p { margin:0; color:#5d6373; }
      .app-block { border:1px solid #e3e6ee; border-radius:20px; padding:20px; display:flex; justify-content:space-between; align-items:center; gap:12px; background:#1f222a; color:#fff; }
      .app-block h2 { margin:0; font-size:clamp(1.3rem,2vw,1.9rem); }
      .app-block p { margin:6px 0 0; color:#d3d7e0; }
      .app-actions { display:flex; gap:8px; flex-wrap:wrap; }
      .app-actions a { text-decoration:none; border:1px solid rgba(255,255,255,.26); color:#fff; border-radius:999px; padding:9px 13px; background:rgba(255,255,255,.1); font-weight:700; }
      .contact { border:1px solid #f1c300; border-radius:20px; padding:20px; display:grid; gap:8px; text-align:center; background:linear-gradient(130deg,#ffe071,#ffd44a); }
      .contact h2 { margin:0; font-size:clamp(1.35rem,2vw,1.9rem); color:#2f3440; }
      .contact p { margin:0; color:#454b59; }
      .contact a { justify-self:center; text-decoration:none; border-radius:999px; padding:10px 15px; color:#fff; background:#d70016; border:1px solid #c90f1f; font-weight:800; }
      .error { background:#fff3ef; border:1px solid #f5c5b7; color:#b92016; border-radius:12px; padding:10px 12px; }
      @media (max-width: 1120px) {
        .hero { grid-template-columns:1fr; min-height:auto; }
        .hero-visual { min-height:300px; }
        .quick-row, .quality-grid { grid-template-columns:1fr 1fr; }
        .app-block { flex-direction:column; align-items:flex-start; }
      }
      @media (max-width: 760px) {
        .menu-shell, .quality, .app-block, .contact { padding:14px; }
        .hero-copy { padding:20px 16px; }
        .quick-row, .quality-grid { grid-template-columns:1fr; }
        .menu-head { flex-direction:column; align-items:flex-start; }
        .top-promo a { margin-left:0; }
      }
    `,
  ],
})
export class GrillPublicComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly cartStorageKey = 'grillCart';

  readonly items = signal<GrillItem[]>([]);
  readonly searchTerm = signal('');
  readonly selectedCategory = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly featuredIndex = signal(0);
  readonly currentSection = signal<'menu' | 'offers' | 'quality' | 'app' | 'contact'>('menu');
  readonly cartCount = signal(0);

  readonly categories = computed(() => {
    const set = new Set(
      this.items()
        .map((item) => String(item.category || '').trim())
        .filter(Boolean),
    );
    return Array.from(set).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredItems = computed(() => {
    const q = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    return this.items().filter((item) => {
      const matchCategory = !cat || item.category === cat;
      const matchText =
        !q ||
        String(item.title || '').toLowerCase().includes(q) ||
        String(item.description || '').toLowerCase().includes(q);
      return matchCategory && matchText;
    });
  });

  readonly featuredItem = computed((): GrillItem | null => {
    const all = this.items();
    if (!all.length) return null;
    const idx = this.featuredIndex();
    const safe = ((idx % all.length) + all.length) % all.length;
    return all[safe];
  });

  ngOnInit(): void {
    this.cartCount.set(this.readCartCount());
    this.loadCatalog();
    setTimeout(() => this.detectCurrentSection(), 0);
  }

  onScroll(): void {
    this.detectCurrentSection();
  }

  nextFeatured(): void {
    const len = this.items().length;
    if (!len) return;
    this.featuredIndex.update((i) => (i + 1) % len);
  }

  prevFeatured(): void {
    const len = this.items().length;
    if (!len) return;
    this.featuredIndex.update((i) => (i - 1 + len) % len);
  }

  scrollToSection(
    event: Event,
    sectionId: 'menu' | 'offers' | 'quality' | 'app' | 'contact',
  ): void {
    event.preventDefault();
    const target = document.getElementById(sectionId);
    if (!target) return;
    this.currentSection.set(sectionId);
    target.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  addToCart(item: GrillItem): void {
    if (item.isAvailable === false) return;

    const cart = JSON.parse(localStorage.getItem(this.cartStorageKey) || '[]');
    const safeCart = Array.isArray(cart) ? cart : [];
    const existing = safeCart.find(
      (line: { id: string; kind: string }) => line.id === item.id && line.kind === item.kind,
    );

    if (existing) {
      existing.qty = Number(existing.qty || 0) + 1;
    } else {
      safeCart.push({
        id: item.id,
        kind: item.kind,
        title: item.title,
        price: Number(item.price || 0),
        imageUrl: item.imageUrl || '',
        qty: 1,
      });
    }

    localStorage.setItem(this.cartStorageKey, JSON.stringify(safeCart));
    this.cartCount.set(this.readCartCount());
    this.notice.set(`${item.title} ajouté au panier grill.`);
    setTimeout(() => this.notice.set(null), 1600);
    this.router.navigate(['/grill/checkout']);
  }

  onItemImageError(id: string): void {
    this.items.update((arr) =>
      arr.map((item) => (item.id === id ? { ...item, imageUrl: '' } : item)),
    );
  }

  stars(rating: number): number[] {
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }

  private readCartCount(): number {
    const cart = JSON.parse(localStorage.getItem(this.cartStorageKey) || '[]');
    return (Array.isArray(cart) ? cart : []).reduce(
      (sum: number, item: { qty?: number }) => sum + Number(item.qty || 0),
      0,
    );
  }

  private loadCatalog(): void {
    this.loading.set(true);
    this.error.set(null);

    forkJoin({
      products: this.api.get<unknown[]>('/grill/products').pipe(catchError(() => of([]))),
      packs: this.api.get<GrillPack[]>('/grill/menu-packs').pipe(catchError(() => of([]))),
    }).subscribe({
      next: ({ products, packs }) => {
        const normalizedProducts = (Array.isArray(products) ? (products as Record<string, unknown>[]) : []).map(
          (item) => ({
            id: String(item?.['id'] ?? ''),
            kind: 'product' as const,
            title: String(item?.['title'] ?? 'Produit grill'),
            description: String(item?.['description'] ?? ''),
            category: item?.['category'] ? String(item['category']) : 'Grill',
            price: Number(item?.['price'] ?? 0),
            currency: String(item?.['currency'] ?? 'XAF'),
            images: Array.isArray(item?.['images']) ? (item['images'] as string[]) : [],
            imageUrl: buildMediaUrl(
              String((item?.['images'] as string[])?.[0] || item?.['imageUrl'] || ''),
            ),
            isAvailable: item?.['isAvailable'] !== false,
            avgRating: Number(item?.['avgRating'] ?? 0),
            reviewsCount: Number(item?.['reviewsCount'] ?? 0),
          }),
        );

        const normalizedPacks = (Array.isArray(packs) ? packs : []).map((item: GrillPack) => ({
          id: String(item?.id ?? ''),
          kind: 'pack' as const,
          title: String(item?.title ?? 'Pack grill'),
          description: String(item?.description ?? ''),
          category: 'Pack menu',
          price: Number(item?.price ?? 0),
          currency: String(item?.currency ?? 'XAF'),
          images: Array.isArray(item?.images) ? item.images : [],
          imageUrl: buildMediaUrl(item?.images?.[0] || ''),
          isAvailable: item?.isAvailable !== false,
          avgRating: 0,
          reviewsCount: 0,
        }));

        this.items.set(
          [...normalizedProducts, ...normalizedPacks].filter((x) => !!x.id),
        );
        this.loading.set(false);

        if (!this.items().length) {
          this.error.set("Aucun produit/menu C'Grill disponible pour le moment.");
        }
      },
      error: () => {
        this.error.set('Impossible de charger les produits grill.');
        this.loading.set(false);
      },
    });
  }

  private detectCurrentSection(): void {
    const sectionIds: Array<'menu' | 'offers' | 'quality' | 'app' | 'contact'> = [
      'menu',
      'offers',
      'quality',
      'app',
      'contact',
    ];

    const offset = 130;
    let active: (typeof sectionIds)[number] = 'menu';

    for (const id of sectionIds) {
      const el = document.getElementById(id);
      if (!el) continue;
      const top = el.getBoundingClientRect().top;
      if (top - offset <= 0) {
        active = id;
      }
    }

    this.currentSection.set(active);
  }
}
