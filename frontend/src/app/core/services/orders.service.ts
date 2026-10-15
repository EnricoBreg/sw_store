import { inject, Injectable, signal } from "@angular/core";
import { OrdersApiService } from "../http/orders-api.service";
import { Router } from "@angular/router";
import { Toaster } from "./toaster";
import { CartService } from "./cart.service";
import { OrdersQuery } from "./admin-orders.service";
import { Order } from "../models/order";
import { ApiResponse, PaginationMeta } from "../models/api-types";
import { getApiError, getApiErrorStatus } from "../http/api-error";

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
  #order = signal<Order | null>(null);
  #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  #error = signal<{ message: string; errors: string[] } | undefined>(undefined);

  orders = this.#orders.asReadonly();
  order = this.#order.asReadonly();
  paginationMeta = this.#paginationMeta.asReadonly();
  error = this.#error.asReadonly();

  loadOrders(page: number = 1, perPage: number = 10, searchQuery?: OrdersQuery) {

    this.api.getOrders(page, perPage, searchQuery).subscribe({
      next: (response) => {
        this.#orders.set(response.data);
      },
      error: (err) => {
        const error = getApiError(
          err,
          $localize`:@@ordersService.loadMyOrdersError:Errore durante il caricamento dei tuoi ordini. Riprova.`,
        );
        this.#error.set(error);
        this.toaster.error(error.message);
      },
    });
  }

  loadOrderById(orderId: number | string) {
    return this.api.getOrderById(orderId).subscribe({
      next: (response) => this.#order.set(response.data),
      error: (err) => {
        // L'ordine non esiste (o non appartiene all'utente): si mostra la pagina "non trovato"
        if (getApiErrorStatus(err) === 404) {
          this.router.navigate(["/not-found"]);
          return;
        }
        const error = getApiError(
          err,
          $localize`:@@ordersService.loadMyOrderError:Errore durante il caricamento dell'ordine. Riprova.`,
        );
        this.#error.set(error);
        this.toaster.error(error.message);
      },
    })
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
        this.toaster.success($localize`:@@toast.orderPlaced:Ordine effettuato con successo!`);
        this.cartService.clearCart();
        this.router.navigate(["/products"]);
      },
      error: (err) => {
        this.#error.set(
          getApiError(err, $localize`:@@ordersService.checkoutError:Errore durante il checkout. Riprova.`),
        );
        this.toaster.error($localize`:@@toast.checkoutFailed:Errore durante il checkout.`);
      },
    });
  }
}
