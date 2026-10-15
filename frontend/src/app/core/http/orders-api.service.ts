import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { Order, OrderStatus } from "../models/order";
import { mapData, mapListData, normalizeOrder } from "../models/normalize";

/** Payload di POST /orders (vedi backend/API.md). */
export interface CheckoutPayload {
  order: {
    first_name: string;
    last_name: string;
    street: string;
    city: string;
    zip_code: string;
    country: string;
    stripe_payment_token: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "orders";

  /** Ordini dell'utente, più recenti prima. `statuses` vuoto = tutti gli stati. */
  getOrders(page: number = 1, limit: number = 10, statuses: OrderStatus[] = []): Observable<ApiResponse<Order[]>> {
    let params = new HttpParams().set("page", page).set("limit", limit);

    if (statuses.length) {
      params = params.set("status", statuses.join(","));
    }

    return this.http.get<ApiResponse<Order[]>>(this.url, { params }).pipe(mapListData(normalizeOrder));
  }

  getOrderById(orderId: number | string): Observable<ApiResponse<Order>> {
    return this.http.get<ApiResponse<Order>>(`${this.url}/${orderId}`).pipe(mapData(normalizeOrder));
  }

  checkout(payload: CheckoutPayload): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.url, payload).pipe(mapData(normalizeOrder));
  }
}
