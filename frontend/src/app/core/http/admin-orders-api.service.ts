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

    if (query) {
      const { fromDate, toDate, status, orderBy, orderDirection, searchTerm, minTotalAmount, maxTotalAmount} = query;

      if (searchTerm) {
        params = params.set("q", searchTerm);
      }
      if (fromDate) {
        params = params.set("from_date", fromDate.toISOString());
      }
      if (toDate) {
        params = params.set("to_date", toDate.toISOString());
      }
      if (status) {
        params = params.set("status", status);
      }
      if (minTotalAmount) {
        params = params.set("min_total_amount", minTotalAmount.toString());
      }
      if (maxTotalAmount) {
        params = params.set("max_total_amount", maxTotalAmount.toString());
      }
      if (orderBy) {
        params = params.set("order_by", orderBy);
      }
      if (orderDirection) {
        params = params.set("order_direction", orderDirection);
      }
    }

    return this.http.get<ApiResponse<Order[]>>(this.url, { params });
  }

  getOrderById(orderId: string | number): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.url}/${orderId}`);
  }
}
