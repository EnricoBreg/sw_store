import { HttpClient, HttpParams } from "@angular/common/http";
import { inject, Injectable, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { Order, OrderStatus } from "../models/order";
import { ApiResponse, PaginationMeta } from "../models/api-types";
import { AdminOrdersApiService } from "../http/admin-orders-api.service";
import { Router } from "@angular/router";
import { Toaster } from "./toaster";

export interface OrdersQuery {
  fromDate?: Date;
  toDate?: Date;
  status?: string;
  searchTerm?: string;
  categoryId?: number;
  orderBy?: string;
  orderDirection?: string;
  minTotalAmount?: number;
  maxTotalAmount?: number;
}

@Injectable({
  providedIn: "root",
})
export class AdminOrdersService {
  private readonly api = inject(AdminOrdersApiService);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  // Esposizione dei signals in modo trasparente al componente che li userà
  #orders = signal<Order[]>([]);
  #order = signal<Order | null>(null);
  #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  #error = signal<string[] | undefined>(undefined);

  orders = this.#orders.asReadonly();
  order = this.#order.asReadonly();
  paginationMeta = this.#paginationMeta.asReadonly();
  error = this.#error.asReadonly();

  loadOrders(page: number = 1, perPage: number = 10, searchQuery?: OrdersQuery) {
    this.api.getOrders(page, perPage, searchQuery).subscribe({
      next: (response) => {
        // Popolamento dello store con i dati di risposta e di paginazione
        this.#orders.set(response.data);
        this.#paginationMeta.set(response.meta);
      },
      error: (err) => {
        // Gestione del messaggio di errore qualora si verifichi
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || "Errore nel caricamento degli ordini.";
        this.#error.set([msg]);
      },
    });
  }

  getById(orderId: number) {
    this.api.getOrderById(orderId).subscribe({
      next: (response) => {
        this.#order.set(response.data);
      },
      error: (err: ApiResponse<null>) => {
        const msg = `${err.message}` || "Errore nel caricamento dell'ordine.";
        this.#error.set(err.errors);

        this.toaster.error(msg);
        this.router.navigate(["/admin/orders"]);
      },
    });
  }

  updateOrderStatus(orderId: number, newStatus: OrderStatus): Observable<ApiResponse<Order>> {
    return this.api.updateOrderStatus(orderId, newStatus).pipe(
      tap({
        next: (response) => {
          this.#error.set(undefined);
          this.#order.set(response.data);
          this.toaster.success("Stato dell'ordine aggiornato con successo.");
        },
        error: (error: ApiResponse<null>) => {
          const msg = `${error.message}` || "Errore nell'aggiornamento dello stato dell'ordine.";
          this.toaster.error(msg);
        },
      }),
    );
  }
}
