import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
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

@Component({
  selector: 'app-shop-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="products-management">
      <div class="header">
        <h1>🛍️ Gestion des Produits C'Shop</h1>
        <button class="btn btn-primary" (click)="showAddModal = true">
          ➕ Ajouter un produit
        </button>
      </div>

      <!-- Loading/Error States -->
      <div *ngIf="loading" class="loading">
        <div class="spinner"></div>
        <p>Chargement...</p>
      </div>

      <div *ngIf="error" class="error">{{ error }}</div>

      <!-- Products Grid -->
      <div *ngIf="!loading" class="products-grid">
        <div *ngFor="let product of products" class="product-card">
          <div class="product-image" [style.background-image]="'url(' + (resolveMediaUrl(product.imageUrl) || '/assets/placeholder.png') + ')'"></div>
          <div class="product-info">
            <h3>{{ product.name }}</h3>
            <p class="product-description" *ngIf="product.sku">Code: {{ product.sku }}</p>
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
            <a
              *ngIf="product.technicalSheetPdf"
              class="tech-sheet-link"
              [href]="resolveMediaUrl(product.technicalSheetPdf)"
              target="_blank"
              rel="noopener noreferrer"
            >
              📄 Télécharger la fiche technique
            </a>
            <div class="product-actions">
              <button class="btn-icon" (click)="editProduct(product)" title="Modifier">✏️</button>
              <button class="btn-icon" (click)="deleteProduct(product.id)" title="Supprimer">🗑️</button>
              <button class="btn-icon" (click)="toggleAvailability(product)" title="Disponibilité">
                {{ product.isAvailable ? '🔒' : '🔓' }}
              </button>
            </div>
          </div>
        </div>

        <div *ngIf="products.length === 0" class="empty-state">
          <p>📦 Aucun produit trouvé</p>
          <button class="btn btn-primary" (click)="showAddModal = true">Ajouter le premier produit</button>
        </div>
      </div>

      <!-- Add/Edit Modal -->
      <div *ngIf="showAddModal" class="modal-overlay" (click)="showAddModal = false">
        <div class="modal" (click)="$event.stopPropagation()">
          <div class="modal-header">
            <h2>{{ editingProduct ? '✏️ Modifier' : '➕ Nouveau' }} Produit</h2>
            <button class="close-btn" (click)="showAddModal = false">✕</button>
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
                <option *ngFor="let category of categoryOptions" [value]="category">{{ category }}</option>
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
              <small class="field-hint" *ngIf="uploadingImages">Upload des images en cours...</small>
              <div class="uploaded-images" *ngIf="formData.images.length > 0">
                <div class="uploaded-image-row" *ngFor="let path of formData.images; let i = index">
                  <input [ngModel]="path" [name]="'uploaded-image-' + i" readonly class="form-control">
                  <button type="button" class="btn btn-secondary btn-remove-image" (click)="removeImage(i)">Retirer</button>
                </div>
              </div>
            </div>
            <div class="form-group" *ngIf="supportsTechnicalSheet(formData.category)">
              <label>Fiche technique (PDF, optionnel)</label>
              <input
                type="file"
                accept=".pdf,application/pdf"
                (change)="onTechnicalSheetSelected($event)"
                class="form-control">
              <small class="field-hint" *ngIf="uploadingTechSheet">Upload du PDF en cours...</small>
              <div class="uploaded-images" *ngIf="formData.technicalSheetPdf">
                <div class="uploaded-image-row">
                  <input [ngModel]="formData.technicalSheetPdf" name="technical-sheet" readonly class="form-control">
                  <button type="button" class="btn btn-secondary btn-remove-image" (click)="clearTechnicalSheet()">
                    Retirer
                  </button>
                </div>
              </div>
            </div>
            <div class="form-group">
              <label class="checkbox-label">
                <input type="checkbox" [(ngModel)]="formData.isAvailable" name="isAvailable">
                Produit disponible
              </label>
            </div>
            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="showAddModal = false">Annuler</button>
              <button type="submit" class="btn btn-primary" [disabled]="saving || uploadingImages || uploadingTechSheet">
                {{ saving ? 'Enregistrement...' : 'Enregistrer' }}
              </button>
            </div>
          </form>
        </div>
      </div>
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

      &.badge-category {
        background: #e9ecef;
        color: #495057;
      }

      &.badge-success {
        background: #d4edda;
        color: #155724;
      }

      &.badge-danger {
        background: #f8d7da;
        color: #721c24;
      }
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

        &:hover:not(:disabled) {
          background: #c82333;
        }
      }

      &.btn-secondary {
        background: #6c757d;
        color: white;

        &:hover {
          background: #5a6268;
        }
      }

      &:disabled {
        opacity: 0.5;
        cursor: not-allowed;
      }
    }

    .btn-icon {
      background: none;
      border: none;
      font-size: 1.25rem;
      cursor: pointer;
      padding: 0.25rem;
      transition: transform 0.2s;

      &:hover {
        transform: scale(1.2);
      }
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
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
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

        h2 {
          margin: 0;
          font-size: 1.5rem;
        }

        .close-btn {
          background: none;
          border: none;
          font-size: 1.5rem;
          cursor: pointer;
          color: #666;

          &:hover {
            color: #333;
          }
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

            &:focus {
              outline: none;
              border-color: #dc3545;
            }
          }

          textarea.form-control {
            resize: vertical;
          }

          .checkbox-label {
            display: flex;
            align-items: center;
            gap: 0.5rem;
            cursor: pointer;

            input[type="checkbox"] {
              width: 20px;
              height: 20px;
            }
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

    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  `]
})
export class ShopProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private apiUrl = buildApiUrl('/cshop/products');
  readonly categoryOptions = [
    'Electronique',
    'Electro-menager',
    'Maison',
    'Mode',
    'Sante',
    'Bebe',
    'Bureau',
    'Auto',
    'Sport',
    'Cuisine',
  ];

  products: Product[] = [];
  loading = false;
  error: string | null = null;
  showAddModal = false;
  saving = false;
  uploadingImages = false;
  uploadingTechSheet = false;
  editingProduct: Product | null = null;

  formData = {
    name: '',
    sku: '',
    description: '',
    price: 0,
    category: '',
    images: [] as string[],
    technicalSheetPdf: '',
    stock: 0,
    isAvailable: true
  };

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading = true;
    this.error = null;
    this.http
      .get<Product[] | ProductListResponse>(`${this.apiUrl}?page=1&limit=500`)
      .subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : data.data ?? [];
        this.products = raw.map((product: any) => ({
          id: product.id,
          name: product.name,
          sku: product.sku ?? '',
          description: product.description || '',
          price: Number(product.finalPrice ?? product.price ?? 0),
          category: this.toCategoryLabel(product.category ?? product.categories?.[0] ?? ''),
          imageUrl: product.imageUrl ?? product.image ?? product.images?.[0],
          images: Array.isArray(product.images) ? product.images : [],
          technicalSheetPdf: product.technicalSheetPdf ?? null,
          stock: Number(product.stock ?? 0),
          isAvailable: Boolean(product.isAvailable ?? product.isActive ?? true),
          createdAt: product.createdAt,
        }));
        this.loading = false;
      },
      error: () => {
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
      }
    });
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
    this.showAddModal = true;
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
      ? this.http.patch(`${this.apiUrl}/${this.editingProduct.id}`, payload)
      : this.http.post(this.apiUrl, payload);

    request.subscribe({
      next: () => {
        this.showAddModal = false;
        this.resetForm();
        this.loadProducts();
        this.saving = false;
      },
      error: (err) => {
        this.error = 'Erreur lors de l\'enregistrement';
        this.saving = false;
      }
    });
  }

  deleteProduct(id: string) {
    if (confirm('Êtes-vous sûr de vouloir supprimer ce produit ?')) {
      this.http.delete(`${this.apiUrl}/${id}`).subscribe({
        next: () => this.loadProducts(),
        error: (err) => this.error = 'Erreur lors de la suppression'
      });
    }
  }

  toggleAvailability(product: Product) {
    this.http.patch(`${this.apiUrl}/${product.id}`, {
      isActive: !product.isAvailable
    }).subscribe({
      next: () => this.loadProducts(),
      error: (err) => this.error = 'Erreur lors de la mise à jour'
    });
  }

  resetForm() {
    this.formData = {
      name: '',
      sku: '',
      description: '',
      price: 0,
      category: '',
      images: [],
      technicalSheetPdf: '',
      stock: 0,
      isAvailable: true
    };
    this.editingProduct = null;
  }

  onProductImagesSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const body = new FormData();
    Array.from(input.files).forEach((file) => body.append('files', file));

    this.uploadingImages = true;
    this.http.post<{ files: string[] }>(`${this.apiUrl}/upload-images`, body).subscribe({
      next: (response) => {
        const uploaded = response.files ?? [];
        this.formData.images = [...(this.formData.images ?? []), ...uploaded];
        input.value = '';
        this.uploadingImages = false;
      },
      error: () => {
        this.error = "Erreur lors de l'upload des images";
        this.uploadingImages = false;
      }
    });
  }

  removeImage(index: number): void {
    this.formData.images.splice(index, 1);
  }

  onTechnicalSheetSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;

    const file = input.files[0];
    const body = new FormData();
    body.append('files', file);

    this.uploadingTechSheet = true;
    this.http
      .post<{ file: string }>(`${this.apiUrl}/upload-technical-sheet`, body)
      .subscribe({
        next: (response) => {
          this.formData.technicalSheetPdf = response.file || '';
          input.value = '';
          this.uploadingTechSheet = false;
        },
        error: () => {
          this.error = "Erreur lors de l'upload du PDF";
          this.uploadingTechSheet = false;
        },
      });
  }

  clearTechnicalSheet(): void {
    this.formData.technicalSheetPdf = '';
  }

  supportsTechnicalSheet(category: string): boolean {
    const normalized = this.toCategoryLabel(category).toLowerCase();
    return normalized === 'electronique' || normalized === 'electro-menager';
  }

  resolveMediaUrl(path?: string | null): string {
    return buildMediaUrl(path);
  }

  private toCategoryLabel(value: string): string {
    const normalized = String(value || '').trim().toLowerCase();
    switch (normalized) {
      case 'electronics':
      case 'electronique':
        return 'Electronique';
      case 'electromenager':
      case 'electro-menager':
      case 'electroménager':
        return 'Electro-menager';
      case 'fashion':
        return 'Mode';
      case 'home':
        return 'Maison';
      case 'health':
      case 'sante':
      case 'santé':
        return 'Sante';
      case 'baby':
      case 'bebe':
      case 'bébé':
        return 'Bebe';
      case 'office':
      case 'bureau':
        return 'Bureau';
      default:
        return String(value || '').trim();
    }
  }
}
