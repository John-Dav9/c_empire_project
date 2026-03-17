import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { Router } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';
import { buildMediaUrl } from '../../../core/config/api.config';
import { AuthService } from '../../../core/services/auth.service';
import { ShopCartService } from '../../../core/services/shop-cart.service';

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
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatChipsModule,
  ],
  templateUrl: './product-list.component.html',
  styleUrls: ['./product-list.component.scss']
})
export class ProductListComponent implements OnInit {
  private readonly selectedProductStorageKey = 'shop_selected_product';

  products: Product[] = [];
  filteredProducts: Product[] = [];
  // Etat UI du filtre catégorie et recherche texte.
  selectedCategory = 'all';
  searchTerm = '';
  loading = true;
  error: string | null = null;
  notice: string | null = null;
  cartCount = 0;
  cartSubtotal = 0;

  constructor(
    private api: ApiService,
    private router: Router,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
    private authService: AuthService,
    private shopCartService: ShopCartService,
  ) {}

  ngOnInit(): void {
    this.loadProducts();
    this.loadCartSummary();
  }

  loadProducts(): void {
    this.loading = true;
    this.error = null;
    this.notice = null;
    this.api
      .get<Product[] | ProductListResponse>('/cshop/products', {
        page: 1,
        limit: 500,
      })
      .subscribe({
        next: (data) => {
          this.zone.run(() => {
            this.products = this.normalizeProducts(data).filter(
              (p) => p.isActive !== false,
            );
            this.applyFilters();
            this.loading = false;
            this.cdr.detectChanges();
          });
        },
        error: (err) => {
          this.zone.run(() => {
            this.error = 'Erreur lors du chargement des produits';
            this.loading = false;
            this.cdr.detectChanges();
          });
          console.error(err);
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
        this.cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        this.cartSubtotal = cart.totalAmount;
        this.notice = `${product.name} ajouté au panier`;
        setTimeout(() => {
          this.notice = null;
        }, 1800);
      },
      error: (err) => {
        this.error = err?.error?.message || "Impossible d'ajouter ce produit au panier.";
      },
    });
  }

  onImageError(product: Product): void {
    product.image = undefined;
  }

  canOpenDetails(product: Product): boolean {
    return !!String(product.id || '').trim();
  }

  get categories(): string[] {
    const values = this.products
      .map((p) => (p.category || '').trim())
      .filter((c) => c.length > 0);
    return Array.from(new Set(values)).sort((a, b) =>
      a.localeCompare(b),
    );
  }

  setCategory(category: string): void {
    // Active un filtre catégorie.
    this.selectedCategory = category;
    this.applyFilters();
  }

  onSearchInput(value: string): void {
    this.searchTerm = value;
    this.applyFilters();
  }

  trackByProductId(_: number, product: Product): string {
    return product.id;
  }

  openDetails(product: Product): void {
    if (!this.canOpenDetails(product)) return;
    sessionStorage.setItem(
      this.selectedProductStorageKey,
      JSON.stringify(product),
    );
    this.router.navigate(['/shop/product', product.id]);
  }

  stars(rating: number): number[] {
    // Helper affichage des étoiles.
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }

  goToCart(): void {
    this.router.navigate(['/shop/cart']);
  }

  private normalizeProducts(data: Product[] | ProductListResponse): Product[] {
    const raw = Array.isArray(data)
      ? data
      : ((data as any)?.data ??
          (data as any)?.items ??
          (data as any)?.results ??
          []);
    return raw
      .map((product: any) => ({
      id: String(product.id ?? product._id ?? '').trim(),
      name: product.name,
      description: product.description || '',
      isActive: product.isActive,
      price: Number(product.finalPrice ?? product.price ?? 0),
      image: buildMediaUrl(product.image ?? product.imageUrl ?? product.images?.[0]),
      category: product.category ?? product.categories?.[0],
      sku: product.sku ?? '',
      stock: Number(product.stock ?? 0),
      avgRating: Number(product.avgRating ?? 0),
      reviewsCount: Number(product.reviewsCount ?? 0),
      }))
      .filter((product: Product) => product.id.length > 0);
  }

  private applyFilters(): void {
    const search = this.searchTerm.trim().toLowerCase();
    this.filteredProducts = this.products.filter((product) => {
      const categoryOk =
        this.selectedCategory === 'all' ||
        (product.category || '').toLowerCase() === this.selectedCategory.toLowerCase();

      if (!categoryOk) return false;
      if (!search) return true;

      return (
        product.name.toLowerCase().includes(search) ||
        (product.sku || '').toLowerCase().includes(search)
      );
    });
  }

  private loadCartSummary(): void {
    if (!this.authService.isAuthenticated()) {
      this.cartCount = 0;
      this.cartSubtotal = 0;
      return;
    }

    this.shopCartService.getCart().subscribe({
      next: (cart) => {
        this.cartCount = cart.items.reduce((sum, item) => sum + item.quantity, 0);
        this.cartSubtotal = cart.totalAmount;
      },
      error: () => {
        this.cartCount = 0;
        this.cartSubtotal = 0;
      },
    });
  }
}
