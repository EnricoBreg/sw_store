import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { CheckoutPayload, OrdersApiService } from "../http/orders-api.service";
import { getApiError, getApiErrorStatus } from "../http/api-error";
import { PaginationMeta } from "../models/api-types";
import { Order, OrderStatus } from "../models/order";
import { CartService } from "./cart.service";
import { Toaster } from "./toaster";

/** Dati del form di checkout (Reactive Form). */
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
    stripe_payment_token: string;
  };
}

export interface OrdersError {
  message: string;
  errors: string[];
}

export type CheckoutStatus = "idle" | "submitting" | "error" | "success";

@Injectable({
  providedIn: "root",
})
export class OrdersService {
  private readonly api = inject(OrdersApiService);
  private readonly cartService = inject(CartService);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  // Lista "I miei ordini"
  readonly #orders = signal<Order[]>([]);
  readonly #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  readonly #listLoaded = signal(false);
  readonly #listError = signal<OrdersError | undefined>(undefined);

  // Dettaglio di un ordine
  readonly #order = signal<Order | null>(null);
  readonly #orderError = signal<OrdersError | undefined>(undefined);

  // Checkout
  readonly #checkoutStatus = signal<CheckoutStatus>("idle");
  readonly #checkoutError = signal<OrdersError | undefined>(undefined);
  #lastCheckoutPayload: CheckoutPayload | null = null;

  readonly orders = this.#orders.asReadonly();
  readonly paginationMeta = this.#paginationMeta.asReadonly();
  readonly listLoaded = this.#listLoaded.asReadonly();
  readonly listError = this.#listError.asReadonly();

  readonly order = this.#order.asReadonly();
  readonly orderError = this.#orderError.asReadonly();

  readonly checkoutStatus = this.#checkoutStatus.asReadonly();
  readonly checkoutError = this.#checkoutError.asReadonly();

  loadOrders(page: number = 1, limit: number = 10, statuses: OrderStatus[] = []) {
    this.#listError.set(undefined);

    this.api.getOrders(page, limit, statuses).subscribe({
      next: (response) => {
        this.#orders.set(response.data);
        this.#paginationMeta.set(response.meta);
        this.#listLoaded.set(true);
      },
      error: (err) => {
        this.#listError.set(
          getApiError(
            err,
            $localize`:@@ordersService.loadMyOrdersError:Errore durante il caricamento dei tuoi ordini. Riprova.`,
          ),
        );
        this.#listLoaded.set(true);
      },
    });
  }

  loadOrderById(orderId: number | string) {
    // Niente dati dell'ordine precedente mentre si carica il nuovo
    this.#order.set(null);
    this.#orderError.set(undefined);

    this.api.getOrderById(orderId).subscribe({
      next: (response) => this.#order.set(response.data),
      error: (err) => {
        // L'ordine non esiste (o non appartiene all'utente): si mostra la pagina "non trovato"
        if (getApiErrorStatus(err) === 404) {
          this.router.navigate(["/not-found"]);
          return;
        }
        this.#orderError.set(
          getApiError(err, $localize`:@@ordersService.loadMyOrderError:Errore durante il caricamento dell'ordine. Riprova.`),
        );
      },
    });
  }

  /** Invia l'ordine (POST /orders). In caso di successo porta alla pagina di conferma. */
  checkout(orderData: OrderData) {
    this.submitCheckout({
      order: {
        first_name: orderData.order.first_name,
        last_name: orderData.order.last_name,
        street: orderData.order.street,
        city: orderData.order.city,
        zip_code: orderData.order.zip_code,
        country: orderData.order.country,
        stripe_payment_token: orderData.payment.stripe_payment_token,
      },
    });
  }

  /** Ripete l'ultimo invio fallito con gli stessi dati. */
  retryCheckout() {
    if (this.#lastCheckoutPayload) {
      this.submitCheckout(this.#lastCheckoutPayload);
    }
  }

  /** Stato iniziale del checkout (all'ingresso nella pagina): nessun errore residuo. */
  resetCheckout() {
    this.#checkoutStatus.set("idle");
    this.#checkoutError.set(undefined);
    this.#lastCheckoutPayload = null;
  }

  private submitCheckout(payload: CheckoutPayload) {
    if (this.#checkoutStatus() === "submitting") return;

    this.#lastCheckoutPayload = payload;
    this.#checkoutStatus.set("submitting");
    this.#checkoutError.set(undefined);

    this.api.checkout(payload).subscribe({
      next: (response) => {
        const order = response.data;
        this.#checkoutStatus.set("success");
        this.#lastCheckoutPayload = null;
        this.#order.set(order);
        // Il backend ha svuotato il carrello: si rilegge lo stato dal server
        this.cartService.loadCart();
        this.toaster.success(response.message || $localize`:@@toast.orderPlaced:Ordine effettuato con successo!`);
        this.router.navigate(["/checkout/confirmation", order.id], { replaceUrl: true });
      },
      error: (err) => {
        this.#checkoutStatus.set("error");
        this.#checkoutError.set(
          getApiError(err, $localize`:@@ordersService.checkoutError:Errore durante il checkout. Riprova.`),
        );
      },
    });
  }
}
