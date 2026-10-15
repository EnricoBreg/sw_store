import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import Product from "../models/product";
import { Wishlist } from "../models/wishlist";
import { mapData, normalizeWishlist } from "../models/normalize";

@Injectable({
  providedIn: "root",
})
export class WishlistsApiService {
  private readonly http = inject(HttpClient);
  private readonly wishlistUrl = "wishlist";
  private readonly wishlistItemsUrl = "wishlist/items";

  loadWishlist(): Observable<ApiResponse<Wishlist>> {
    return this.http.get<ApiResponse<Wishlist>>(this.wishlistUrl).pipe(mapData(normalizeWishlist));
  }

  addToWishlist(product: Product): Observable<ApiResponse<Wishlist>> {
    return this.http.post<ApiResponse<Wishlist>>(this.wishlistItemsUrl, {
      wishlist_item: {
        product_id: product.id,
      },
    }).pipe(mapData(normalizeWishlist));
  }

  removeFromWishlist(product: Product): Observable<ApiResponse<Wishlist>> {
    return this.http
      .delete<ApiResponse<Wishlist>>(`${this.wishlistItemsUrl}/${product.id}`)
      .pipe(mapData(normalizeWishlist));
  }

  moveToCart(product: Product): Observable<ApiResponse<Wishlist>> {
    return this.http
      .put<ApiResponse<Wishlist>>(`${this.wishlistItemsUrl}/${product.id}/move`, {})
      .pipe(mapData(normalizeWishlist));
  }
}
