import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-types';
import Product from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class ProductsApiService {
  private readonly http = inject(HttpClient);
  private readonly url = '/products';

  getProducts(page = 1, limit = 1): Observable<ApiResponse<Product[]>> {
    const params = new HttpParams()
      .set("page", page)
      .set("limit", limit);

    return this.http.get<ApiResponse<Product[]>>(this.url, { params });
  } 

  getById(productId: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.url}/${productId}`);
  }
}
