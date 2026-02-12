import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ApiService } from '../../../core/services/api.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  stock: number;
  specifications?: string[];
}

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
  product: Product | null = null;
  loading = true;
  error: string | null = null;
  form: FormGroup;
  private productId: string = '';

  constructor(
    private api: ApiService,
    private route: ActivatedRoute,
    private fb: FormBuilder
  ) {
    this.form = this.fb.group({
      quantity: [1, [Validators.required, Validators.min(1)]]
    });
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      this.productId = params['id'];
      this.loadProduct();
    });
  }

  loadProduct(): void {
    this.api.get<Product>(`/cshop/products/${this.productId}`).subscribe({
      next: (data) => {
        this.product = {
          id: (data as any).id,
          name: (data as any).name,
          description: (data as any).description || '',
          price: Number((data as any).finalPrice ?? (data as any).price ?? 0),
          image:
            (data as any).image ??
            (data as any).imageUrl ??
            (data as any).images?.[0],
          category: (data as any).category ?? (data as any).categories?.[0],
          stock: Number((data as any).stock ?? 0),
          specifications: (data as any).specifications,
        };
        this.form.patchValue({ quantity: 1 });
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement du produit';
        this.loading = false;
        console.error(err);
      }
    });
  }

  addToCart(): void {
    if (this.form.invalid || !this.product) return;

    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const quantity = this.form.value.quantity;
    const existingItem = cart.find((item: any) => item.id === this.product!.id);

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      cart.push({ ...this.product, quantity });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    this.form.reset({ quantity: 1 });
    // TODO: Show toast notification
  }
}
