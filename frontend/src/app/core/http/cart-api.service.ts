import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { Cart, CartItem } from "../models/cart";
import { mapData, normalizeCart } from "../models/normalize";
import Product from "../models/product";

@Injectable({
  providedIn: "root",
})
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly cartUrl = "cart";
  private readonly cartItemsUrl = "cart/items";

  loadCart(): Observable<ApiResponse<Cart>> {
    return this.http.get<ApiResponse<Cart>>(this.cartUrl).pipe(mapData(normalizeCart));
  }

  /** Aggiunge un prodotto (se è già nel carrello il backend somma la quantità). */
  addToCart(product: Product, quantity: number = 1): Observable<ApiResponse<Cart>> {
    return this.http
      .post<ApiResponse<Cart>>(this.cartItemsUrl, {
        cart_item: {
          product_id: product.id,
          quantity,
        },
      })
      .pipe(mapData(normalizeCart));
  }

  /** Imposta la quantità finale di una riga (≥ 1; per rimuovere si usa removeFromCart). */
  updateQuantity(item: CartItem, quantity: number): Observable<ApiResponse<Cart>> {
    return this.http
      .patch<ApiResponse<Cart>>(`${this.cartItemsUrl}/${item.id}`, { cart_item: { quantity } })
      .pipe(mapData(normalizeCart));
  }

  removeFromCart(item: CartItem): Observable<ApiResponse<Cart>> {
    return this.http.delete<ApiResponse<Cart>>(`${this.cartItemsUrl}/${item.id}`).pipe(mapData(normalizeCart));
  }
}
