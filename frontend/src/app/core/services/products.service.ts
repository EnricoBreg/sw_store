import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import Product from '../models/product';
import { ApiResponse } from '../models/api-types';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly baseUrl = "http://localhost:3000/api/v1/products";
  private readonly http = inject(HttpClient);

  list(page: number = 1, perPage: number = 10): Observable<ApiResponse<Product[]>> {
    const params = new HttpParams()
      .set("page", page)
      .set("limit", perPage);

    return this.http.get<ApiResponse<Product[]>>(this.baseUrl, {
      params,
      headers: {
        "Accept-Language": "it"
      }
    })
  }

  get(id: number): Observable<ApiResponse<Product>> {
    return this.http.get<ApiResponse<Product>>(`${this.baseUrl}/${id}`)
  }
}
