import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatChipsModule } from '@angular/material/chips';
import { RouterLink } from '@angular/router';
import { ApiService } from '../../../core/services/api.service';

interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image?: string;
  category?: string;
  stock: number;
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
    RouterLink
  ],
  templateUrl: './product-list.component.html',
  styleUrl: './product-list.component.scss'
})
export class ProductListComponent implements OnInit {
  products: Product[] = [];
  loading = true;
  error: string | null = null;

  constructor(private api: ApiService) {}

  ngOnInit(): void {
    this.loadProducts();
  }

  loadProducts(): void {
    this.api.get<Product[] | ProductListResponse>('/cshop/products').subscribe({
      next: (data) => {
        const raw = Array.isArray(data) ? data : data.data;
        this.products = raw.map((product: any) => ({
          id: product.id,
          name: product.name,
          description: product.description || '',
          price: Number(product.finalPrice ?? product.price ?? 0),
          image: product.image ?? product.imageUrl ?? product.images?.[0],
          category: product.category ?? product.categories?.[0],
          stock: Number(product.stock ?? 0),
        }));
        this.loading = false;
      },
      error: (err) => {
        this.error = 'Erreur lors du chargement des produits';
        this.loading = false;
        console.error(err);
      }
    });
  }

  addToCart(product: Product): void {
    // Store in localStorage for now
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    const existingItem = cart.find((item: any) => item.id === product.id);

    if (existingItem) {
      existingItem.quantity++;
    } else {
      cart.push({ ...product, quantity: 1 });
    }

    localStorage.setItem('cart', JSON.stringify(cart));
    // TODO: Show toast notification
  }
}
