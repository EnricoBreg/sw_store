import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import Category from "../models/category";

@Injectable({
  providedIn: "root",
})
export class CategoriesApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "categories";

  /** Tutte le categorie, senza paginazione (GET /categories?all=true). */
  getAll(): Observable<ApiResponse<Category[]>> {
    return this.http.get<ApiResponse<Category[]>>(this.url, { params: new HttpParams().set("all", true) });
  }

  getById(categoryId: number): Observable<ApiResponse<Category>> {
    return this.http.get<ApiResponse<Category>>(`${this.url}/${categoryId}`);
  }
}
