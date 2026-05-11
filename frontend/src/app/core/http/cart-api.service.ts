import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { Cart } from "../models/cart";
import Product from "../models/product";

@Injectable({
  providedIn: "root",
})
export class CartApiService {
  private readonly http = inject(HttpClient);
  private readonly cartUrl = "cart";
  private readonly cartItemsUrl = "cart/items"

  loadCart(): Observable<ApiResponse<Cart>> {
    return this.http.get<ApiResponse<Cart>>(this.cartUrl);
  }

  addToCart(product: Product, quantity: number = 1): Observable<ApiResponse<Cart>> {
    return this.http.post<ApiResponse<Cart>>(this.cartItemsUrl, {
      cart_item: {
        product_id: product.id,
        quantity,
      },
    });
  }

  removeFromCart(product: Product): Observable<ApiResponse<Cart>> {
    return this.http.delete<ApiResponse<Cart>>(`${this.cartItemsUrl}/${product.id}`);
  }

  updateQuantity(product: Product, quantity: number): Observable<ApiResponse<Cart>> {
    return this.http.put<ApiResponse<Cart>>(`${this.cartItemsUrl}/${product.id}`, {
      cart_item: {
        quantity
      }
    });
  }
}
