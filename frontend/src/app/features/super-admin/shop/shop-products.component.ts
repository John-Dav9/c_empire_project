import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { buildApiUrl, buildMediaUrl } from '../../../core/config/api.config';

interface Product {
  id: string;
  name: string;
  sku?: string;
  description: string;
  price: number;
  category: string;
  imageUrl?: string;
  images?: string[];
  technicalSheetPdf?: string | null;
  stock: number;
  isAvailable: boolean;
  createdAt: string;
}

interface ProductListResponse {
  data: any[];
  total: number;
  page: number;
  limit: number;
}

interface Promo {
  id: string;
  title: string;
  code?: string;
  type: 'percent' | 'fixed';
  value: number;
  isActive: boolean;
  startsAt?: string;
  endsAt?: string;
}

@Component({
  selector: 'app-shop-products',
  imports: [FormsModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="products-management">
      <div class="header">
        <h1>🛍️ Gestion des Produits C'Shop</h1>
        <button class="btn btn-primary" (click)="openAddModal()">
          ➕ Ajouter un produit
        </button>
      </div>

      @if (loading) {
        <div class="loading">
          <div class="spinner"></div>
          <p>Chargement...</p>
        </div>
      }

      @if (error) {
        <div class="error">{{ error }}</div>
      }

      @if (!loading) {
        <div class="products-grid">
          @for (product of products; track product.id) {
            <div class="product-card">
              <div class="product-image" [style.background-image]="'url(' + (resolveMediaUrl(product.imageUrl) || '/assets/placeholder.png') + ')'"></div>
              <div class="product-info">
                <h3>{{ product.name }}</h3>
                @if (product.sku) {
                  <p class="product-description">Code: {{ product.sku }}</p>
                }
                <p class="product-description">{{ product.description }}</p>
                <div class="product-meta">
                  <span class="badge badge-category">{{ product.category }}</span>
                  <span class="badge" [class.badge-success]="product.isAvailable" [class.badge-danger]="!product.isAvailable">
                    {{ product.isAvailable ? 'Disponible' : 'Indisponible' }}
                  </span>
                </div>
                <div class="product-footer">
                  <span class="price">{{ product.price }} FCFA</span>
                  <span class="stock">Stock: {{ product.stock }}</span>
                </div>
                @if (product.technicalSheetPdf) {
                  <a
                    class="tech-sheet-link"
                    [href]="resolveMediaUrl(product.technicalSheetPdf)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    📄 Télécharger la fiche technique
                  </a>
                }
                <div class="product-actions">
                  <button class="btn-icon" (click)="editProduct(product)" title="Modifier">✏️</button>
                  <button class="btn-icon" (click)="deleteProduct(product.id)" title="Supprimer">🗑️</button>
                  <button class="btn-icon" (click)="toggleAvailability(product)" title="Disponibilité">
                    {{ product.isAvailable ? '🔒' : '🔓' }}
                  </button>
                </div>
              </div>
            </div>
          }

          @if (products.length === 0) {
            <div class="empty-state">
              <p>📦 Aucun produit trouvé</p>
              <button class="btn btn-primary" (click)="openAddModal()">Ajouter le premier produit</button>
            </div>
          }
        </div>
      }

      <!-- Add/Edit Modal -->
      @if (showAddModal) {
        <div class="modal-overlay" (click)="closeModal()">
          <div class="modal" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h2>{{ editingProduct ? '✏️ Modifier' : '➕ Nouveau' }} Produit</h2>
              <button class="close-btn" (click)="closeModal()">✕</button>
            </div>
            <form (ngSubmit)="saveProduct()" class="modal-body">
              <div class="form-group">
                <label>Nom du produit *</label>
                <input [(ngModel)]="formData.name" name="name" required class="form-control">
              </div>
              <div class="form-group">
                <label>Code produit (SKU)</label>
                <input [(ngModel)]="formData.sku" name="sku" class="form-control" placeholder="ex: CSH-000123">
              </div>
              <div class="form-group">
                <label>Description</label>
                <textarea [(ngModel)]="formData.description" name="description" class="form-control" rows="3"></textarea>
              </div>
              <div class="form-row">
                <div class="form-group">
                  <label>Prix (FCFA) *</label>
                  <input type="number" [(ngModel)]="formData.price" name="price" required class="form-control">
                </div>
                <div class="form-group">
                  <label>Stock *</label>
                  <input type="number" [(ngModel)]="formData.stock" name="stock" required class="form-control">
                </div>
              </div>
              <div class="form-group">
                <label>Catégorie *</label>
                <select [(ngModel)]="formData.category" name="category" required class="form-control">
                  <option value="">Sélectionner...</option>
                  @for (category of categoryOptions; track category) {
                    <option [value]="category">{{ category }}</option>
                  }
                </select>
              </div>
              <div class="form-group">
                <label>Images du produit</label>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  (change)="onProductImagesSelected($event)"
                  class="form-control">
                @if (uploadingImages) {
                  <small class="field-hint">Upload des images en cours...</small>
                }
                @if (formData.images.length > 0) {
                  <div class="uploaded-images">
                    @for (path of formData.images; track path; let i = $index) {
                      <div class="uploaded-image-row">
                        <input [ngModel]="path" [name]="'uploaded-image-' + i" readonly class="form-control">
                        <button type="button" class="btn btn-secondary btn-remove-image" (click)="removeImage(i)">Retirer</button>
                      </div>
                    }
                  </div>
                }
              </div>
              @if (supportsTechnicalSheet(formData.category)) {
                <div class="form-group">
                  <label>Fiche technique (PDF, optionnel)</label>
                  <input
                    type="file"
                    accept=".pdf,application/pdf"
                    (change)="onTechnicalSheetSelected($event)"
                    class="form-control">
                  @if (uploadingTechSheet) {
                    <small class="field-hint">Upload du PDF en cours...</small>
                  }
                  @if (formData.technicalSheetPdf) {
                    <div class="uploaded-images">
                      <div class="uploaded-image-row">
                        <input [ngModel]="formData.technicalSheetPdf" name="technical-sheet" readonly class="form-control">
                        <button type="button" class="btn btn-secondary btn-remove-image" (click)="clearTechnicalSheet()">
                          Retirer
                        </button>
                      </div>
                    </div>
                  }
                </div>
              }
              <div class="form-group">
                <label class="checkbox-label">
                  <input type="checkbox" [(ngModel)]="formData.isAvailable" name="isAvailable">
                  Produit disponible
                </label>
              </div>

              <!-- ── Promo section ─────────────────────────────────────── -->
              <div class="promo-section">
                <button type="button" class="promo-toggle" (click)="promoOpen = !promoOpen">
                  🏷️ Promotion
                  <span class="promo-toggle-icon">{{ promoOpen ? '▲' : '▼' }}</span>
                </button>

                @if (promoOpen) {
                  <!-- Existing promos for this product -->
                  @if (editingProduct && existingPromos.length > 0) {
                    <div class="existing-promos">
                      <p class="promo-subtitle">Promotions existantes</p>
                      @for (promo of existingPromos; track promo.id) {
                        <div class="promo-item">
                          <div class="promo-item-info">
                            <strong>{{ promo.title }}</strong>
                            <span class="promo-value">
                              −{{ promo.value }}{{ promo.type === 'percent' ? '%' : ' XAF' }}
                            </span>
                            @if (promo.code) {
                              <span class="promo-code">{{ promo.code }}</span>
                            }
                          </div>
                          <div class="promo-item-actions">
                            <span class="badge" [class.badge-success]="promo.isActive" [class.badge-danger]="!promo.isActive">
                              {{ promo.isActive ? 'Active' : 'Inactive' }}
                            </span>
                            <button type="button" class="btn btn-small" [class.btn-secondary]="promo.isActive" [class.btn-primary]="!promo.isActive"
                              (click)="togglePromo(promo)">
                              {{ promo.isActive ? 'Désactiver' : 'Activer' }}
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }

                  <!-- New promo form -->
                  <div class="new-promo-form">
                    <p class="promo-subtitle">{{ editingProduct ? 'Ajouter une nouvelle promotion' : 'Configurer une promotion' }}</p>
                    <div class="form-group">
                      <label>Titre de la promo</label>
                      <input [(ngModel)]="promoForm.title" name="promo-title" class="form-control" placeholder="ex: Soldes d'été">
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Type</label>
                        <select [(ngModel)]="promoForm.type" name="promo-type" class="form-control">
                          <option value="percent">Pourcentage (%)</option>
                          <option value="fixed">Montant fixe (XAF)</option>
                        </select>
                      </div>
                      <div class="form-group">
                        <label>Valeur *</label>
                        <input type="number" [(ngModel)]="promoForm.value" name="promo-value" class="form-control"
                          [placeholder]="promoForm.type === 'percent' ? 'ex: 20' : 'ex: 5000'" min="0">
                      </div>
                    </div>
                    <div class="form-group">
                      <label>Code promo (optionnel)</label>
                      <input [(ngModel)]="promoForm.code" name="promo-code" class="form-control" placeholder="ex: ETE2025" style="text-transform:uppercase">
                    </div>
                    <div class="form-row">
                      <div class="form-group">
                        <label>Début (optionnel)</label>
                        <input type="datetime-local" [(ngModel)]="promoForm.startsAt" name="promo-starts" class="form-control">
                      </div>
                      <div class="form-group">
                        <label>Fin (optionnel)</label>
                        <input type="datetime-local" [(ngModel)]="promoForm.endsAt" name="promo-ends" class="form-control">
                      </div>
                    </div>
                    <div class="form-group">
                      <label class="checkbox-label">
                        <input type="checkbox" [(ngModel)]="promoForm.isActive" name="promo-active">
                        Activer immédiatement
                      </label>
                    </div>
                    @if (promoError) {
                      <p class="promo-error">{{ promoError }}</p>
                    }
                  </div>
                }
              </div>
              <!-- ─────────────────────────────────────────────────────── -->

              <div class="modal-footer">
                <button type="button" class="btn btn-secondary" (click)="closeModal()">Annuler</button>
                <button type="submit" class="btn btn-primary" [disabled]="saving || uploadingImages || uploadingTechSheet">
                  {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
                </button>
              </div>
            </form>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .products-management {
      padding: 2rem;
      max-width: 1400px;
      margin: 0 auto;
    }

    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;

      h1 {
        font-size: 2rem;
        font-weight: 700;
        color: #1a1a1a;
        margin: 0;
      }
    }

    .products-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
      gap: 1.5rem;
    }

    .product-card {
      background: white;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: transform 0.2s;

      &:hover {
        transform: translateY(-5px);
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
      }

      .product-image {
        width: 100%;
        height: 200px;
        background-size: cover;
        background-position: center;
        background-color: #f0f0f0;
      }

      .product-info {
        padding: 1.5rem;

        h3 {
          font-size: 1.25rem;
          font-weight: 600;
          margin: 0 0 0.5rem;
        }

        .product-description {
          color: #666;
          font-size: 0.875rem;
          margin-bottom: 1rem;
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }

        .product-meta {
          display: flex;
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .product-footer {
          display: flex;
          justify-content: space-between;
          margin-bottom: 1rem;
          padding-top: 1rem;
          border-top: 1px solid #eee;

          .price {
            font-size: 1.25rem;
            font-weight: 700;
            color: #dc3545;
          }

          .stock {
            color: #666;
            font-size: 0.875rem;
          }
        }

        .product-actions {
          display: flex;
          gap: 0.5rem;
          justify-content: flex-end;
        }

        .tech-sheet-link {
          display: inline-flex;
          margin-bottom: 0.9rem;
          font-size: 0.86rem;
          font-weight: 600;
          color: #305ea8;
          text-decoration: none;

          &:hover {
            text-decoration: underline;
          }
        }
      }
    }

    .badge {
      display: inline-block;
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;

      &.badge-category { background: #e9ecef; color: #495057; }
      &.badge-success  { background: #d4edda; color: #155724; }
      &.badge-danger   { background: #f8d7da; color: #721c24; }
    }

    .btn {
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 8px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;

      &.btn-primary {
        background: #dc3545;
        color: white;
        &:hover:not(:disabled) { background: #c82333; }
      }
      &.btn-secondary {
        background: #6c757d;
        color: white;
        &:hover { background: #5a6268; }
      }
      &.btn-small {
        padding: 0.35rem 0.75rem;
        font-size: 0.8rem;
      }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }

    .btn-icon {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      transition: transform 0.2s;
      &:hover { transform: scale(1.2); }
    }

    .loading, .empty-state {
      text-align: center;
      padding: 3rem;
      color: #666;

      .spinner {
        border: 4px solid #f3f3f3;
        border-top: 4px solid #dc3545;
        border-radius: 50%;
        width: 50px;
        height: 50px;
        animation: spin 1s linear infinite;
        margin: 0 auto 1rem;
      }
    }

    .error {
      background: #f8d7da;
      color: #721c24;
      padding: 1rem;
      border-radius: 8px;
      margin-bottom: 1rem;
    }

    .modal-overlay {
      position: fixed;
      inset: 0;
      background: rgba(0, 0, 0, 0.5);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1000;
    }

    .modal {
      background: white;
      border-radius: 12px;
      width: 90%;
      max-width: 600px;
      max-height: 90vh;
      overflow-y: auto;

      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 1.5rem;
        border-bottom: 1px solid #eee;

        h2 { margin: 0; font-size: 1.5rem; }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;
          &:hover { color: #333; }
        }
      }

      .modal-body {
        padding: 1.5rem;

        .form-group {
          margin-bottom: 1.5rem;

          label {
            display: block;
            margin-bottom: 0.5rem;
            font-weight: 600;
            color: #333;
          }

          .form-control {
            width: 100%;
            padding: 0.75rem;
            border: 1px solid #ddd;
            border-radius: 8px;
            font-size: 1rem;
            box-sizing: border-box;
            &:focus { outline: none; border-color: #dc3545; }
          }

          textarea.form-control { resize: vertical; }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;
            input[type="checkbox"] { width: 20px; height: 20px; }
          }

          .field-hint {
            display: block;
            margin-top: 0.45rem;
            color: #666;
            font-size: 0.82rem;
            font-weight: 600;
          }

          .uploaded-images {
            margin-top: 0.65rem;
            display: flex;
            flex-direction: column;
            gap: 0.55rem;
          }

          .uploaded-image-row {
            display: grid;
            grid-template-columns: 1fr auto;
            gap: 0.5rem;
            align-items: center;
          }

          .btn-remove-image {
            padding: 0.6rem 0.8rem;
            font-size: 0.85rem;
          }
        }

        .form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 1rem;
        }
      }

      .modal-footer {
        display: flex;
        justify-content: flex-end;
        gap: 1rem;
        padding-top: 1rem;
        border-top: 1px solid #eee;
      }
    }

    /* ── Promo section ─────────────────────────────────────────── */
    .promo-section {
      border: 1px dashed #dc3545;
      border-radius: 10px;
      margin-bottom: 1.5rem;
      overflow: hidden;
    }

    .promo-toggle {
      width: 100%;
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem 1rem;
      background: #fff5f5;
      border: none;
      cursor: pointer;
      font-size: 0.95rem;
      font-weight: 700;
      color: #dc3545;

      .promo-toggle-icon { font-size: 0.75rem; }

      &:hover { background: #ffe5e5; }
    }

    .promo-subtitle {
      font-size: 0.82rem;
      font-weight: 700;
      color: #888;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin: 0 0 0.75rem;
    }

    .existing-promos {
      padding: 1rem;
      border-bottom: 1px dashed #f5c6cb;
    }

    .promo-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
      padding: 0.6rem 0;
      border-bottom: 1px solid #f0f0f0;
      flex-wrap: wrap;

      &:last-child { border-bottom: none; }

      .promo-item-info {
        display: flex;
        align-items: center;
        gap: 0.5rem;
        flex-wrap: wrap;
        font-size: 0.9rem;
      }

      .promo-value {
        background: #f8d7da;
        color: #721c24;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        font-size: 0.8rem;
        font-weight: 700;
      }

      .promo-code {
        background: #e2e3e5;
        color: #383d41;
        padding: 0.15rem 0.5rem;
        border-radius: 6px;
        font-size: 0.78rem;
        font-family: monospace;
      }

      .promo-item-actions {
        display: flex;
        align-items: center;
        gap: 0.5rem;
      }
    }

    .new-promo-form {
      padding: 1rem;

      .form-group { margin-bottom: 1rem; }
    }

    .promo-error {
      color: #dc3545;
      font-size: 0.875rem;
      margin-top: 0.5rem;
    }

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ShopProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private cdr = inject(ChangeDetectorRef);
  private readonly apiUrl = buildApiUrl('/cshop/products');
  private readonly promoApiUrl = buildApiUrl('/cshop/promotions');

  readonly categoryOptions = [
    'Electronique', 'Electro-menager', 'Maison', 'Mode',
    'Sante', 'Bebe', 'Bureau', 'Auto', 'Sport', 'Cuisine',
  ];

  products: Product[] = [];
  loading = false;
  error: string | null = null;
  showAddModal = false;
  saving = false;
  uploadingImages = false;
  uploadingTechSheet = false;
  editingProduct: Product | null = null;

  // Promo state
  promoOpen = false;
  existingPromos: Promo[] = [];
  promoError: string | null = null;
  promoForm = this.emptyPromoForm();

  formData = this.emptyForm();

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = null;
    this.http.get<Product[] | ProductListResponse>(`${this.apiUrl}?page=1&limit=500`).subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : (data as ProductListResponse).data ?? [];
        this.products = raw.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku ?? '',
          description: p.description || '',
          price: Number(p.finalPrice ?? p.price ?? 0),
          category: this.toCategoryLabel(p.category ?? p.categories?.[0] ?? ''),
          imageUrl: p.imageUrl ?? p.image ?? p.images?.[0],
          images: Array.isArray(p.images) ? p.images : [],
          technicalSheetPdf: p.technicalSheetPdf ?? null,
          stock: Number(p.stock ?? 0),
          isAvailable: Boolean(p.isAvailable ?? p.isActive ?? true),
          createdAt: p.createdAt,
        }));
        this.loading = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
        this.cdr.markForCheck();
      }
    });
  }

  openAddModal() {
    this.editingProduct = null;
    this.formData = this.emptyForm();
    this.promoOpen = false;
    this.promoForm = this.emptyPromoForm();
    this.existingPromos = [];
    this.promoError = null;
    this.showAddModal = true;
  }

  editProduct(product: Product) {
    this.editingProduct = product;
    this.formData = {
      name: product.name,
      sku: product.sku ?? '',
      description: product.description,
      price: product.price,
      category: this.toCategoryLabel(product.category),
      images: product.images?.length ? [...product.images] : product.imageUrl ? [product.imageUrl] : [],
      technicalSheetPdf: product.technicalSheetPdf ?? '',
      stock: product.stock,
      isAvailable: product.isAvailable
    };
    this.promoOpen = false;
    this.promoForm = this.emptyPromoForm();
    this.promoError = null;
    this.loadExistingPromos(product.id);
    this.showAddModal = true;
  }

  private loadExistingPromos(productId: string) {
    this.http.get<Promo[]>(`${this.promoApiUrl}/product/${productId}/active`).subscribe({
      next: (promos) => {
        this.existingPromos = promos;
        this.cdr.markForCheck();
      },
      error: () => { this.existingPromos = []; }
    });
  }

  closeModal() {
    this.showAddModal = false;
    this.editingProduct = null;
    this.formData = this.emptyForm();
    this.promoForm = this.emptyPromoForm();
    this.existingPromos = [];
    this.promoError = null;
    this.promoOpen = false;
  }

  saveProduct() {
    this.saving = true;
    const payload = {
      name: this.formData.name,
      sku: this.formData.sku.trim() || undefined,
      description: this.formData.description,
      price: Number(this.formData.price),
      stock: Number(this.formData.stock),
      isActive: this.formData.isAvailable,
      categories: this.formData.category ? [this.toCategoryLabel(this.formData.category)] : [],
      images: this.formData.images,
      technicalSheetPdf: this.formData.technicalSheetPdf || undefined,
    };

    const request = this.editingProduct
      ? this.http.patch<any>(`${this.apiUrl}/${this.editingProduct.id}`, payload)
      : this.http.post<any>(this.apiUrl, payload);

    request.subscribe({
      next: (savedProduct) => {
        const productId = savedProduct?.id ?? this.editingProduct?.id;
        if (this.promoOpen && this.promoForm.title && this.promoForm.value > 0 && productId) {
          this.savePromo(productId, () => {
            this.closeModal();
            this.loadProducts();
            this.saving = false;
          });
        } else {
          this.closeModal();
          this.loadProducts();
          this.saving = false;
        }
      },
      error: () => {
        this.error = 'Erreur lors de l\'enregistrement';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  private savePromo(productId: string, onDone: () => void) {
    const dto = {
      productIds: [productId],
      title: this.promoForm.title,
      type: this.promoForm.type,
      value: Number(this.promoForm.value),
      code: this.promoForm.code.trim().toUpperCase() || undefined,
      isActive: this.promoForm.isActive,
      startsAt: this.promoForm.startsAt || undefined,
      endsAt: this.promoForm.endsAt || undefined,
    };
    this.http.post(this.promoApiUrl, dto).subscribe({
      next: () => onDone(),
      error: (err) => {
        this.promoError = err.error?.message || 'Erreur lors de la création de la promo';
        this.saving = false;
        this.cdr.markForCheck();
      }
    });
  }

  togglePromo(promo: Promo) {
    const newState = !promo.isActive;
    this.http.patch(`${this.promoApiUrl}/${promo.id}/active/${newState}`, {}).subscribe({
      next: () => {
        promo.isActive = newState;
        this.cdr.markForCheck();
      },
      error: () => alert('Erreur lors de la mise à jour de la promotion')
    });
  }

  deleteProduct(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => this.loadProducts(),
        error: () => this.error = 'Erreur lors de la suppression'
      });
    }
  }

  toggleAvailability(product: Product) {
    this.http.patch(`${this.apiUrl}/${product.id}`, { isActive: !product.isAvailable }).subscribe({
      next: () => this.loadProducts(),
      error: () => this.error = 'Erreur lors de la mise à jour'
    });
  }

  onProductImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const body = new FormData();
    Array.from(input.files).forEach((file) => body.append('files', file));
    this.uploadingImages = true;
    this.http.post<{ files: string[] }>(`${this.apiUrl}/upload-images`, body).subscribe({
      next: (response) => {
        this.formData.images = [...this.formData.images, ...(response.files ?? [])];
        input.value = '';
        this.uploadingImages = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = "Erreur lors de l'upload des images";
        this.uploadingImages = false;
        this.cdr.markForCheck();
      }
    });
  }

  removeImage(index: number): void {
    this.formData.images.splice(index, 1);
  }

  onTechnicalSheetSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files?.length) return;
    const body = new FormData();
    body.append('files', input.files[0]);
    this.uploadingTechSheet = true;
    this.http.post<{ file: string }>(`${this.apiUrl}/upload-technical-sheet`, body).subscribe({
      next: (response) => {
        this.formData.technicalSheetPdf = response.file || '';
        input.value = '';
        this.uploadingTechSheet = false;
        this.cdr.markForCheck();
      },
      error: () => {
        this.error = "Erreur lors de l'upload du PDF";
        this.uploadingTechSheet = false;
        this.cdr.markForCheck();
      }
    });
  }

  clearTechnicalSheet(): void {
    this.formData.technicalSheetPdf = '';
  }

  supportsTechnicalSheet(category: string): boolean {
    const n = this.toCategoryLabel(category).toLowerCase();
    return n === 'electronique' || n === 'electro-menager';
  }

  resolveMediaUrl(path?: string | null): string {
    return buildMediaUrl(path);
  }

  private emptyForm() {
    return { name: '', sku: '', description: '', price: 0, category: '', images: [] as string[], technicalSheetPdf: '', stock: 0, isAvailable: true };
  }

  private emptyPromoForm() {
    return { title: '', type: 'percent' as 'percent' | 'fixed', value: 0, code: '', startsAt: '', endsAt: '', isActive: true };
  }

  private toCategoryLabel(value: string): string {
    const n = String(value || '').trim().toLowerCase();
    switch (n) {
      case 'electronics': case 'electronique': return 'Electronique';
      case 'electromenager': case 'electro-menager': case 'electroménager': return 'Electro-menager';
      case 'fashion': return 'Mode';
      case 'home': return 'Maison';
      case 'health': case 'sante': case 'santé': return 'Sante';
      case 'baby': case 'bebe': case 'bébé': return 'Bebe';
      case 'office': case 'bureau': return 'Bureau';
      default: return String(value || '').trim();
    }
  }
}
