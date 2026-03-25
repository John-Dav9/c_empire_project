import { ChangeDetectionStrategy, Component, OnInit, computed, inject, signal } from '@angular/core';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { DecimalPipe } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { buildMediaUrl } from '../../../core/config/api.config';
import { AuthService } from '../../../core/services/auth.service';
import { ShopCartService } from '../../../core/services/shop-cart.service';
import { CurrencyXafPipe } from '../../../shared/pipes/currency-xaf.pipe';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  isActive?: boolean;
  image?: string;
  category?: string;
  sku?: string;
  stock: number;
  avgRating: number;
  reviewsCount: number;
}

interface ProductListResponse {
  data: Product[];
  total: number;
  page: number;
  limit: number;
}

@Component({
  selector: 'app-product-list',
  imports: [
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
    DecimalPipe,
    CurrencyXafPipe,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ProductListComponent implements OnInit {
  private readonly api = inject(ApiService);
  private readonly router = inject(Router);
  private readonly authService = inject(AuthService);
  private readonly shopCartService = inject(ShopCartService);
  private readonly selectedProductStorageKey = 'shop_selected_product';

  readonly products = signal<Product[]>([]);
  readonly selectedCategory = signal('all');
  readonly searchTerm = signal('');
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly notice = signal<string | null>(null);
  readonly cartCount = signal(0);
  readonly cartSubtotal = signal(0);

  readonly categories = computed(() => {
    const values = this.products()
      .map((p) => (p.category || '').trim())
      .filter((c) => c.length > 0);
    return Array.from(new Set(values)).sort((a, b) => a.localeCompare(b));
  });

  readonly filteredProducts = computed(() => {
    const search = this.searchTerm().trim().toLowerCase();
    const cat = this.selectedCategory();
    return this.products().filter((product) => {
      const categoryOk =
        cat === 'all' ||
        (product.category || '').toLowerCase() === cat.toLowerCase();
      if (!categoryOk) return false;
      if (!search) return true;
      return (
        product.name.toLowerCase().includes(search) ||
        (product.sku || '').toLowerCase().includes(search)
      );
    });
  });

  ngOnInit(): void {
    this.loadProducts();
    this.loadCartSummary();
  }

  loadProducts(): void {
    this.loading.set(true);
    this.error.set(null);
    this.notice.set(null);
    this.api
      .get<Product[] | ProductListResponse>('/cshop/products', {
        page: 1,
        limit: 500,
      })
      .subscribe({
        next: (data) => {
          this.products.set(
            this.normalizeProducts(data).filter((p) => p.isActive !== false),
          );
          this.loading.set(false);
        },
        error: (err: unknown) => {
          console.error(err);
          this.error.set('Erreur lors du chargement des produits');
          this.loading.set(false);
        },
      });
  }

  addToCart(product: Product): void {
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/signin'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.shopCartService.addItem(product.id, 1).subscribe({
      next: (cart) => {
        this.cartCount.set(cart.items.reduce((sum, item) => sum + item.quantity, 0));
        this.cartSubtotal.set(cart.totalAmount);
        this.notice.set(`${product.name} ajouté au panier`);
        setTimeout(() => this.notice.set(null), 1800);
      },
      error: (err: { error?: { message?: string } }) => {
        this.error.set(err?.error?.message || "Impossible d'ajouter ce produit au panier.");
      },
    });
  }

  onImageError(productId: string): void {
    this.products.update((arr) =>
      arr.map((p) => (p.id === productId ? { ...p, image: undefined } : p)),
    );
  }

  canOpenDetails(product: Product): boolean {
    return !!String(product.id || '').trim();
  }

  setCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  openDetails(product: Product): void {
    if (!this.canOpenDetails(product)) return;
    sessionStorage.setItem(this.selectedProductStorageKey, JSON.stringify(product));
    void this.router.navigate(['/shop/product', product.id]);
  }

  stars(rating: number): number[] {
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }

  truncate(text: string, max = 100): string {
    return text.length > max ? text.slice(0, max) + '...' : text;
  }

  goToCart(): void {
    void this.router.navigate(['/shop/cart']);
  }

  private normalizeProducts(data: Product[] | ProductListResponse): Product[] {
    const raw = Array.isArray(data)
      ? data
      : (((data as unknown) as Record<string, unknown>)?.['data'] ??
          ((data as unknown) as Record<string, unknown>)?.['items'] ??
          ((data as unknown) as Record<string, unknown>)?.['results'] ??
          []);
    return (raw as Record<string, unknown>[])
      .map((product) => ({
        id: String(product['id'] ?? product['_id'] ?? '').trim(),
        name: String(product['name'] ?? ''),
        description: String(product['description'] ?? ''),
        isActive: product['isActive'] as boolean | undefined,
        price: Number(product['finalPrice'] ?? product['price'] ?? 0),
        image: buildMediaUrl(
          String(
            product['image'] ??
            product['imageUrl'] ??
            (product['images'] as string[])?.[0] ??
            '',
          ),
        ),
        category: product['category'] != null
          ? String(product['category'])
          : (product['categories'] as string[])?.[0],
        sku: String(product['sku'] ?? ''),
        stock: Number(product['stock'] ?? 0),
        avgRating: Number(product['avgRating'] ?? 0),
        reviewsCount: Number(product['reviewsCount'] ?? 0),
      }))
      .filter((product) => product.id.length > 0);
  }

  private loadCartSummary(): void {
    if (!this.authService.isAuthenticated()) {
      return;
    }
    this.shopCartService.getCart().subscribe({
      next: (cart) => {
        this.cartCount.set(cart.items.reduce((sum, item) => sum + item.quantity, 0));
        this.cartSubtotal.set(cart.totalAmount);
      },
      error: () => {
        this.cartCount.set(0);
        this.cartSubtotal.set(0);
      },
    });
  }
}
