import { inject, Injectable, signal } from "@angular/core";
import { OrdersApiService } from "../http/orders-api.service";
import { Router } from "@angular/router";
import { Toaster } from "./toaster";
import { CartService } from "./cart.service";
import { OrdersQuery } from "./admin-orders.service";
import { Order } from "../models/order";
import { ApiResponse, PaginationMeta } from "../models/api-types";

export interface OrderData {
  order: {
    first_name: string;
    last_name: string;
    street: string;
    city: string;
    zip_code: string;
    country: string;
  };
  payment: {
    payment_method: string;
    stripe_payment_token?: string;
  };
}

@Injectable({
  providedIn: "root",
})
export class OrdersService {
  private readonly api = inject(OrdersApiService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  #orders = signal<Order[]>([]);
  #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  #error = signal<{ message: string; errors: string[] } | undefined>(undefined);

  orders = this.#orders.asReadonly();
  paginationMeta = this.#paginationMeta.asReadonly();
  error = this.#error.asReadonly();

  loadOrders(page: number = 1, perPage: number = 10, searchQuery?: OrdersQuery) {

    this.api.getOrders(page, perPage, searchQuery).subscribe({
      next: (response) => {
        this.#orders.set(response.data);
      },
      error: (err: ApiResponse<null>) => {
        const message = err.message || "Errore durante il caricamento dei tuoi ordini. Riprova.";
        this.#error.set({ message: message, errors: err.errors || [] });
        this.toaster.error(message);
      },
    });
  }

  checkout(orderData: OrderData) {
    // parsing dei dati del form in un formato adatto alla richiesta API
    const parsedOrderData = {
      order: {
        first_name: orderData.order.first_name,
        last_name: orderData.order.last_name,
        street: orderData.order.street,
        city: orderData.order.city,
        zip_code: orderData.order.zip_code,
        country: orderData.order.country,
        stripe_payment_token: orderData.payment.stripe_payment_token,
      },
    };

    this.api.checkout(parsedOrderData).subscribe({
      next: (response) => {
        this.toaster.success("Ordine effettuato con successo!");
        this.cartService.clearCart();
        this.router.navigate(["/products"]);
      },
      error: (err) => {
        this.#error.set({ message: err.error.message, errors: err.error.errors });
        this.toaster.error("Errore durante il checkout.");
      },
    });
  }
}
