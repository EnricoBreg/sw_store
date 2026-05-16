import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import Product from "../models/product";
import { ProductsQuery } from "../services/products.service";

@Injectable({
  providedIn: "root",
})
export class AdminProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "admin/products";

  getProducts(page = 1, limit = 10, query?: ProductsQuery): Observable<ApiResponse<Product[]>> {
    let params = new HttpParams().set("page", page).set("limit", limit);

    if (query) {
      const { searchTerm, categoryId, orderBy, orderDirection } = query;

      if (searchTerm) {
        params = params.set("q", searchTerm);
      }
      if (categoryId) {
        params = params.set("category_id", categoryId);
      }
      if (orderBy) {
        params = params.set("order_by", orderBy);
      }
      if (orderDirection) {
        params = params.set("order_direction", orderDirection);
      }
    }

    return this.http.get<ApiResponse<Product[]>>(this.url, { params });
  }

  getById(productId: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.url}/${productId}`);
  }

  create(formData: FormData): Observable<ApiResponse<Product>> {
    return this.http.post<ApiResponse<Product>>(this.url, formData);
  }

  update(productId: number, formData: FormData): Observable<ApiResponse<Product>> {
    return this.http.patch<ApiResponse<Product>>(`${this.url}/${productId}`, formData);
  }
}
