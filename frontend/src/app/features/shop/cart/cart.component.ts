import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatTableModule } from '@angular/material/table';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';

interface CartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatInputModule,
    MatFormFieldModule,
    ReactiveFormsModule,
    FormsModule,
    RouterLink
  ],
  templateUrl: './cart.component.html',
  styleUrl: './cart.component.scss'
})
export class CartComponent implements OnInit {
  items: CartItem[] = [];
  displayedColumns = ['image', 'name', 'price', 'quantity', 'total', 'actions'];
  subtotal = 0;
  shipping = 5000; // Fixed shipping cost
  total = 0;

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    const cart = JSON.parse(localStorage.getItem('cart') || '[]');
    this.items = cart;
    this.calculateTotals();
  }

  calculateTotals(): void {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.total = this.subtotal + this.shipping;
  }

  increaseQuantity(index: number): void {
    if (this.items[index]) {
      this.items[index].quantity++;
      this.updateCart();
    }
  }

  decreaseQuantity(index: number): void {
    if (this.items[index] && this.items[index].quantity > 1) {
      this.items[index].quantity--;
      this.updateCart();
    }
  }

  removeItem(index: number): void {
    this.items.splice(index, 1);
    this.updateCart();
  }

  private updateCart(): void {
    localStorage.setItem('cart', JSON.stringify(this.items));
    this.calculateTotals();
  }
}
