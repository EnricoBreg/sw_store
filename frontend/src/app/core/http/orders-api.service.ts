import { HttpClient } from "@angular/common/http";
import { inject, Injectable } from "@angular/core";
import { OrderData } from "../services/orders.service";
import { Observable } from "rxjs";
import { ApiResponse } from "../models/api-types";
import { Order } from "../models/order";

@Injectable({
  providedIn: "root",
})
export class OrdersApiService {
  private readonly http = inject(HttpClient);
  private readonly url = "orders";

  checkout(orderData: any): Observable<ApiResponse<Order>> {
    return this.http.post<ApiResponse<Order>>(this.url, orderData);
  }
}
