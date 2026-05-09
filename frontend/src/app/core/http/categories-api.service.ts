import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { ApiResponse } from '../models/api-types';
import Category from '../models/category';
import Product from '../models/product';

@Injectable({
  providedIn: 'root',
})
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = 'categories';

  getCategories(page = 1, limit = 10): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.url);
  }

  getById(categoryId: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.url}/${categoryId}`);
  }
}
