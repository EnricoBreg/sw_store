import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { OrderData } from "../services/orders.service";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { Order } from "../models/order";
import { OrdersQuery } from "../services/admin-orders.service";

@Injectable({
  providedIn: "root",
})
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "orders";

  getOrders(page: number = 1, perPage: number = 10, searchQuery?: OrdersQuery): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams()
      .set("page", page)
      .set("per_page", perPage);

    if (searchQuery) {
      const { fromDate, toDate, orderBy, orderDirection } = searchQuery;
      
      if (orderBy) {
        params = params.set("order_by", orderBy);
      }
      if (orderDirection) {
        params = params.set("order_direction", orderDirection);
      }
    }

    return this.http.get<ApiResponse<Order[]>>(this.url, { params });
  }

  getOrderById(orderId: number | string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.url}/${orderId}`);
  }

  checkout(orderData: any): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.url, orderData);
  }
}
