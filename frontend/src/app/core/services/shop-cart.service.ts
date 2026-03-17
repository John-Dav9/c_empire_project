import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiService } from './api.service';
import { buildMediaUrl } from '../config/api.config';

export interface ShopCartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image?: string;
}

export interface ShopCart {
  id: string;
  totalAmount: number;
  items: ShopCartItem[];
}

@Injectable({ providedIn: 'root' })
export class ShopCartService {
  constructor(private readonly api: ApiService) {}

  getCart(): Observable<ShopCart> {
    return this.api.get<any>('/cshop/cart').pipe(map((cart) => this.mapCart(cart)));
  }

  addItem(productId: string, quantity: number): Observable<ShopCart> {
    return this.api
      .post<any>('/cshop/cart/add', { productId, quantity })
      .pipe(map((cart) => this.mapCart(cart)));
  }

  updateItem(itemId: string, quantity: number): Observable<ShopCart> {
    return this.api
      .patch<any>(`/cshop/cart/item/${itemId}`, { quantity })
      .pipe(map((cart) => this.mapCart(cart)));
  }

  removeItem(itemId: string): Observable<ShopCart> {
    return this.api
      .delete<any>(`/cshop/cart/item/${itemId}`)
      .pipe(map((cart) => this.mapCart(cart)));
  }

  clearCart(): Observable<ShopCart> {
    return this.api.delete<any>('/cshop/cart/clear').pipe(map((cart) => this.mapCart(cart)));
  }

  private mapCart(cart: any): ShopCart {
    const items = Array.isArray(cart?.items) ? cart.items : [];
    return {
      id: String(cart?.id || ''),
      totalAmount: Number(cart?.totalAmount || 0),
      items: items.map((item: any) => ({
        id: String(item?.id || ''),
        productId: String(item?.productId || ''),
        name: String(item?.productName || item?.name || ''),
        price: Number(item?.unitPrice || item?.price || 0),
        quantity: Number(item?.quantity || 0),
        image: buildMediaUrl(item?.image ?? item?.imageUrl),
      })),
    };
  }
}
