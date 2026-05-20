import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { OrdersQuery } from "../services/admin-orders.service";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { Order } from "../models/order";

@Injectable({
  providedIn: "root",
})
export class AdminOrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "admin/orders";

  getOrders(page = 1, limit = 10, query?: OrdersQuery): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams().set("page", page).set("limit", limit);

    /* if (query) {
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
    } */

    return this.http.get<ApiResponse<Order[]>>(this.url, { params });
  }
}
