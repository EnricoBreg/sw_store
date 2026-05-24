import { inject, Injectable, signal } from "@angular/core";
import { OrdersApiService } from "../http/orders-api.service";
import { Router } from "@angular/router";
import { Toaster } from "./toaster";
import { CartService } from "./cart.service";

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

  #error = signal<{ title: string; errors: string[] } | undefined>(undefined);

  error = this.#error.asReadonly();

  checkout(orderData: OrderData) {
    console.log(orderData);
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
        this.#error.set({ title: err.error.message, errors: err.error.errors });
        this.toaster.error("Errore durante il checkout.");
      },
    });
  }
}
