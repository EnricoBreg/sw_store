import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import Category from "../models/category";

export interface CategoryPayload {
  name: string;
  description: string | null;
}

@Injectable({
  providedIn: "root",
})
export class AdminCategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "admin/categories";

  /** Tutte le categorie con `products_count` (GET /admin/categories?all=true). */
  getAll(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.url, { params: new HttpParams().set("all", true) });
  }

  create(category: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.post<ApiResponse<Category>>(this.url, { category });
  }

  update(categoryId: number, category: CategoryPayload): Observable<ApiResponse<Category>> {
    return this.http.patch<ApiResponse<Category>>(`${this.url}/${categoryId}`, { category });
  }

  delete(categoryId: number): Observable<ApiResponse<unknown>> {
    return this.http.delete<ApiResponse<unknown>>(`${this.url}/${categoryId}`);
  }
}
