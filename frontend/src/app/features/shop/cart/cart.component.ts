import { ChangeDetectorRef, Component, NgZone, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { ShopCartItem, ShopCartService } from '../../../core/services/shop-cart.service';

type CartItem = ShopCartItem & { selected?: boolean };

@Component({
  selector: 'app-cart',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
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
  subtotal = 0;
  shipping = 5000;
  total = 0;
  selectedSubtotal = 0;
  selectedTotal = 0;
  loading = true;
  error: string | null = null;
  private readonly checkoutSelectionKey = 'checkoutCartItemIds';

  constructor(
    private router: Router,
    private shopCartService: ShopCartService,
    private zone: NgZone,
    private cdr: ChangeDetectorRef,
  ) {}

  ngOnInit(): void {
    this.loadCart();
  }

  loadCart(): void {
    this.loading = true;
    this.error = null;
    const selectedIds = this.readSelection();

    this.shopCartService.getCart().subscribe({
      next: (cart) => {
        this.zone.run(() => {
          this.items = cart.items.map((item) => ({
            ...item,
            selected:
              selectedIds.length > 0 ? selectedIds.includes(item.id) : true,
          }));
          this.loading = false;
          this.calculateTotals();
          this.cdr.detectChanges();
        });
      },
      error: (err) => {
        this.zone.run(() => {
          this.loading = false;
          this.error = err?.error?.message || 'Impossible de charger le panier.';
          this.items = [];
          this.cdr.detectChanges();
        });
      },
    });
  }

  calculateTotals(): void {
    this.subtotal = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
    this.total = this.subtotal + this.shipping;

    const selected = this.items.filter((item) => !!item.selected);
    this.selectedSubtotal = selected.reduce(
      (sum, item) => sum + item.price * item.quantity,
      0,
    );
    const selectedShipping = selected.length > 0 ? this.shipping : 0;
    this.selectedTotal = this.selectedSubtotal + selectedShipping;
  }

  increaseQuantity(index: number): void {
    if (this.items[index]) {
      const item = this.items[index];
      this.shopCartService.updateItem(item.id, item.quantity + 1).subscribe({
        next: () => this.loadCart(),
        error: (err) => {
          this.error = err?.error?.message || 'Impossible de mettre à jour la quantité.';
        },
      });
    }
  }

  decreaseQuantity(index: number): void {
    if (this.items[index] && this.items[index].quantity > 1) {
      const item = this.items[index];
      this.shopCartService.updateItem(item.id, item.quantity - 1).subscribe({
        next: () => this.loadCart(),
        error: (err) => {
          this.error = err?.error?.message || 'Impossible de mettre à jour la quantité.';
        },
      });
    }
  }

  removeItem(index: number): void {
    const item = this.items[index];
    if (!item) return;

    this.shopCartService.removeItem(item.id).subscribe({
      next: () => this.loadCart(),
      error: (err) => {
        this.error = err?.error?.message || 'Impossible de retirer cet article.';
      },
    });
  }

  toggleSelectAll(checked: boolean): void {
    this.items = this.items.map((item) => ({ ...item, selected: checked }));
    this.calculateTotals();
    this.persistSelection();
  }

  onSelectionChange(): void {
    this.calculateTotals();
    this.persistSelection();
  }

  proceedToCheckout(): void {
    const selected = this.items.filter((item) => !!item.selected);
    if (!selected.length) return;

    sessionStorage.setItem(
      this.checkoutSelectionKey,
      JSON.stringify(selected.map((item) => item.id)),
    );
    this.router.navigate(['/payments/checkout']);
  }

  get allSelected(): boolean {
    return this.items.length > 0 && this.items.every((item) => !!item.selected);
  }

  get selectedCount(): number {
    return this.items.filter((item) => !!item.selected).length;
  }

  private readSelection(): string[] {
    const raw = sessionStorage.getItem(this.checkoutSelectionKey);
    if (!raw) return [];
    try {
      const parsed = JSON.parse(raw);
      return Array.isArray(parsed) ? parsed.map((value) => String(value)) : [];
    } catch {
      return [];
    }
  }

  private persistSelection(): void {
    sessionStorage.setItem(
      this.checkoutSelectionKey,
      JSON.stringify(
        this.items.filter((item) => !!item.selected).map((item) => item.id),
      ),
    );
  }
}
