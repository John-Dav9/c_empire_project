import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';
import { buildMediaUrl } from '../../../core/config/api.config';
import { AuthService } from '../../../core/services/auth.service';
import { ShopCartService } from '../../../core/services/shop-cart.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  images: string[];
  category?: string;
  stock: number;
  specifications?: string[];
  colorOptions: string[];
  customizationOptions: ProductCustomizationOption[];
  avgRating: number;
  reviewsCount: number;
}

interface ProductListResponse {
  data: any[];
}

type ProductCustomizationOption = {
  id: string;
  label: string;
  priceDelta: number;
};

@Component({
  selector: 'app-product-detail',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    MatProgressSpinnerModule,
    ReactiveFormsModule,
    RouterLink
  ],
  templateUrl: './product-detail.component.html',
  styleUrl: './product-detail.component.scss'
})
export class ProductDetailComponent implements OnInit {
  private readonly selectedProductStorageKey = 'shop_selected_product';
  // Produit courant affiché dans la fiche.
  product: Product | null = null;
  // Extrait d'avis visibles sous la fiche.
  reviews: Array<{ id: string; rating: number; comment?: string }> = [];
  // Set pour gérer l'activation des options de personnalisation.
  selectedCustomizations = new Set<string>();
  currentImageIndex = 0;
  loading = true;
  error: string | null = null;
  reviewError: string | null = null;
  reviewSuccess: string | null = null;
  reviewLoading = false;
  reviewForm: FormGroup;
  form: FormGroup;
  private productId: string = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private fb: FormBuilder,
    private router: Router,
    private authService: AuthService,
    private shopCartService: ShopCartService,
  ) {
    this.form = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1)]],
      selectedColor: [''],
    });
    this.reviewForm = this.fb.group({
      rating: [5, [Validators.required, Validators.min(1), Validators.max(5)]],
      comment: [''],
    });
  }

  ngOnInit(): void {
    // Recharge la fiche à chaque changement d'id dans l'URL.
    this.route.params.subscribe(params => {
      this.productId = String(params['id'] || '').trim();
      this.hydrateFromSelectionCache();
      this.loadProduct();
    });
  }

  loadProduct(): void {
    const hasHydratedProduct =
      !!this.product && String(this.product.id || '').trim() === this.productId;
    this.loading = !hasHydratedProduct;
    this.error = null;
    if (!hasHydratedProduct) {
      this.product = null;
    }

    if (!this.productId || this.productId === 'undefined' || this.productId === 'null') {
      this.loading = false;
      this.error = 'Identifiant produit invalide.';
      return;
    }

    // Mapping défensif de la réponse API pour alimenter une vue stable.
    this.api.get<any>(`/cshop/products/${this.productId}`).subscribe({
      next: (data) => {
        try {
          const payload = (data as any)?.data ?? data;
          const source =
            Array.isArray(payload)
              ? payload.find((item) =>
                  String(item?.id ?? item?._id ?? '').trim() === this.productId,
                )
              : payload;

          if (!source) {
            this.loadProductFromCatalogFallback();
            return;
          }

          this.product = this.mapProduct(source);
        if (!this.product.id) {
            this.loadProductFromCatalogFallback();
            return;
          }
          if (this.product.images.length === 0 && this.product.image) {
            this.product.images = [this.product.image];
          }
          this.currentImageIndex = 0;
          this.setImageByIndex(0);
          this.selectedCustomizations.clear();
          this.form.patchValue({
            quantity: 1,
            selectedColor: this.product.colorOptions[0] || '',
          });
          this.loadReviews();
          this.loading = false;
        } catch (mapError) {
          console.error(mapError);
          this.loadProductFromCatalogFallback();
          return;
        }
      },
      error: (err) => {
        console.error(err);
        this.loadProductFromCatalogFallback();
      }
    });
  }

  addToCart(): void {
    if (this.form.invalid || !this.product) return;
    const quantity = Number(this.form.value.quantity || 1);
    if (!this.authService.isAuthenticated()) {
      void this.router.navigate(['/auth/signin'], {
        queryParams: { returnUrl: this.router.url },
      });
      return;
    }

    this.shopCartService.addItem(this.product.id, quantity).subscribe({
      next: () => {
        this.form.patchValue({ quantity: 1 });
        void this.router.navigate(['/shop/cart']);
      },
      error: (err) => {
        this.error = err?.error?.message || "Impossible d'ajouter ce produit au panier.";
      },
    });
  }

  onImageError(): void {
    if (!this.product) return;
    this.product.image = undefined;
  }

  setImageByIndex(index: number): void {
    if (!this.product || !this.product.images.length) return;
    const clamped = Math.max(0, Math.min(this.product.images.length - 1, index));
    this.currentImageIndex = clamped;
    this.product.image = this.product.images[clamped];
  }

  nextImage(): void {
    if (!this.product || this.product.images.length < 2) return;
    this.setImageByIndex((this.currentImageIndex + 1) % this.product.images.length);
  }

  prevImage(): void {
    if (!this.product || this.product.images.length < 2) return;
    this.setImageByIndex(
      (this.currentImageIndex - 1 + this.product.images.length) % this.product.images.length,
    );
  }

  stars(rating: number): number[] {
    // Convertit une note en état de 5 étoiles (pleine/vide).
    const rounded = Math.round(Number(rating || 0));
    return [1, 2, 3, 4, 5].map((i) => (i <= rounded ? 1 : 0));
  }

  selectRating(rating: number): void {
    // Sélection note utilisateur pour création d'avis.
    this.reviewForm.patchValue({ rating });
  }

  get isAuthenticated(): boolean {
    return !!this.authService.getAccessToken();
  }

  get selectedCustomizationObjects(): ProductCustomizationOption[] {
    // Extrait les options actives pour calcul prix/panier.
    if (!this.product) return [];
    return this.product.customizationOptions.filter((opt) =>
      this.selectedCustomizations.has(opt.id),
    );
  }

  get customizationsDelta(): number {
    // Somme des surcoûts liés aux options choisies.
    return this.selectedCustomizationObjects.reduce(
      (sum, opt) => sum + Number(opt.priceDelta || 0),
      0,
    );
  }

  get unitPrice(): number {
    // Prix unitaire dynamique (base + personnalisations).
    if (!this.product) return 0;
    return Math.max(0, Number(this.product.price) + Number(this.customizationsDelta));
  }

  get lineTotal(): number {
    // Prix total dynamique selon quantité.
    const quantity = Number(this.form.value.quantity || 1);
    return Math.max(0, this.unitPrice * quantity);
  }

  get quantityOptions(): number[] {
    if (!this.product) return [1];
    const max = Math.min(20, Math.max(1, Number(this.product.stock || 1)));
    return Array.from({ length: max }, (_, idx) => idx + 1);
  }

  get colorShowcase(): Array<{ name: string; image?: string }> {
    if (!this.product) return [];
    if (!this.product.colorOptions.length) return [];
    return this.product.colorOptions.map((color, idx) => ({
      name: color,
      image: this.product!.images[idx % Math.max(1, this.product!.images.length)],
    }));
  }

  selectColor(color: string, imageIndex?: number): void {
    this.form.patchValue({ selectedColor: color });
    if (typeof imageIndex === 'number') {
      this.setImageByIndex(imageIndex);
    }
  }

  increaseQuantity(): void {
    // Stepper quantité avec plafond = stock.
    if (!this.product) return;
    const current = Number(this.form.value.quantity || 1);
    const next = Math.min(this.product.stock || 1, current + 1);
    this.form.patchValue({ quantity: next });
  }

  decreaseQuantity(): void {
    // Stepper quantité avec plancher = 1.
    const current = Number(this.form.value.quantity || 1);
    const next = Math.max(1, current - 1);
    this.form.patchValue({ quantity: next });
  }

  normalizeQuantity(): void {
    // Sécurise la saisie manuelle (borne 1..stock).
    if (!this.product) return;
    const raw = Number(this.form.value.quantity || 1);
    const clamped = Math.max(1, Math.min(this.product.stock || 1, Math.floor(raw || 1)));
    this.form.patchValue({ quantity: clamped });
  }

  toggleCustomization(id: string): void {
    // Active/désactive une option de personnalisation.
    if (this.selectedCustomizations.has(id)) {
      this.selectedCustomizations.delete(id);
    } else {
      this.selectedCustomizations.add(id);
    }
  }

  submitReview(): void {
    // Dépôt d'avis C'Shop (nécessite authentification).
    if (!this.isAuthenticated) {
      this.reviewError = 'Connectez-vous pour laisser un avis.';
      this.reviewSuccess = null;
      return;
    }
    if (this.reviewForm.invalid || !this.product) return;

    this.reviewLoading = true;
    this.reviewError = null;
    this.reviewSuccess = null;

    this.api.post('/cshop/reviews', {
      productId: this.product.id,
      rating: Number(this.reviewForm.value.rating),
      comment: (this.reviewForm.value.comment || '').trim() || undefined,
    }).subscribe({
      next: () => {
        this.reviewLoading = false;
        this.reviewSuccess = 'Merci, votre avis a été enregistré.';
        this.reviewForm.patchValue({ rating: 5, comment: '' });
        this.loadProduct();
      },
      error: (err) => {
        this.reviewLoading = false;
        this.reviewError = err?.error?.message || 'Impossible d’enregistrer votre avis.';
      },
    });
  }

  private loadReviews(): void {
    if (!this.productId) {
      this.reviews = [];
      return;
    }

    this.api.get<Array<{ id: string; rating: number; comment?: string }>>(`/cshop/reviews/product/${this.productId}`).subscribe({
      next: (data) => {
        this.reviews = (Array.isArray(data) ? data : []).slice(0, 5);
      },
      error: () => {
        this.reviews = [];
      },
    });
  }

  private resolveColorOptions(data: any): string[] {
    const direct = Array.isArray(data.colorOptions)
      ? data.colorOptions
      : Array.isArray(data.colors)
        ? data.colors
        : [];
    return direct.map((v: any) => String(v || '').trim()).filter(Boolean);
  }

  private resolveCustomizationOptions(data: any): ProductCustomizationOption[] {
    const direct = Array.isArray(data.customizationOptions) ? data.customizationOptions : [];
    return direct
      .map((opt: any, index: number) => ({
        id: String(opt.id || opt.code || `opt-${index}`),
        label: String(opt.label || opt.name || '').trim(),
        priceDelta: Number(opt.priceDelta || opt.extraPrice || 0),
      }))
      .filter((opt: ProductCustomizationOption) => opt.label.length > 0);
  }

  private loadProductFromCatalogFallback(): void {
    this.api
      .get<any[] | ProductListResponse>('/cshop/products', { page: 1, limit: 500 })
      .subscribe({
        next: (data) => {
          const raw = Array.isArray(data) ? data : data?.data ?? [];
          const source = raw.find(
            (item: any) =>
              String(item?.id ?? item?._id ?? '').trim() === this.productId,
          );
          if (!source) {
            this.error = 'Produit introuvable ou supprimé.';
            this.product = null;
            this.loading = false;
            return;
          }
          this.product = this.mapProduct(source);
          if (this.product.images.length === 0 && this.product.image) {
            this.product.images = [this.product.image];
          }
          this.currentImageIndex = 0;
          this.setImageByIndex(0);
          this.selectedCustomizations.clear();
          this.form.patchValue({
            quantity: 1,
            selectedColor: this.product.colorOptions[0] || '',
          });
          this.loadReviews();
          this.loading = false;
        },
        error: () => {
          this.error = 'Erreur lors du chargement du produit.';
          this.product = null;
          this.loading = false;
        },
      });
  }

  private mapProduct(source: any): Product {
    return {
      id: String(source?.id ?? source?._id ?? '').trim(),
      name: String(source?.name ?? ''),
      description: String(source?.description ?? ''),
      price: Number(source?.finalPrice ?? source?.price ?? 0),
      image: buildMediaUrl(source?.image ?? source?.imageUrl ?? source?.images?.[0]),
      images: (Array.isArray(source?.images) ? source.images : [])
        .filter((src: string) => !!src)
        .map((src: string) => buildMediaUrl(src)),
      category: source?.category ?? source?.categories?.[0],
      stock: Number(source?.stock ?? 0),
      specifications: source?.specifications,
      colorOptions: this.resolveColorOptions(source),
      customizationOptions: this.resolveCustomizationOptions(source),
      avgRating: Number(source?.avgRating ?? 0),
      reviewsCount: Number(source?.reviewsCount ?? 0),
    };
  }

  private hydrateFromSelectionCache(): void {
    if (!this.productId) return;
    const raw = sessionStorage.getItem(this.selectedProductStorageKey);
    if (!raw) return;

    try {
      const cached = JSON.parse(raw);
      const cachedId = String(cached?.id ?? cached?._id ?? '').trim();
      if (!cachedId || cachedId !== this.productId) return;

      this.product = this.mapProduct(cached);
      if (this.product.images.length === 0 && this.product.image) {
        this.product.images = [this.product.image];
      }
      this.currentImageIndex = 0;
      this.setImageByIndex(0);
      this.selectedCustomizations.clear();
      this.form.patchValue({
        quantity: 1,
        selectedColor: this.product.colorOptions[0] || '',
      });
      this.loading = false;
      this.error = null;
    } catch {
      // Cache invalide: ignoré.
    }
  }
}
