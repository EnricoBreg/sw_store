import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { CartApiService } from "../http/cart-api.service";
import { Cart, CartItem } from "../models/cart";
import Product from "../models/product";
import { CartStore } from "../state/cart.store";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private api = inject(CartApiService);
  private store = inject(CartStore);

  #cart = signal<Cart | null>(this.store.cart());
  #isLoading = signal<boolean>(false);
  #error = signal<string | undefined>(undefined);

  cart = this.#cart.asReadonly();
  isLoading = this.#isLoading.asReadonly();
  error = this.#error.asReadonly();

  cartItemCount = computed(() => this.#cart()?.items.length ?? 0);

  constructor() {
    effect(() => {
      const cart = this.#cart();

      if (cart) {
        this.store.setCart(cart);
      }
    });
  }

  loadCart() {
    this.#isLoading.set(true);

    this.api.loadCart().subscribe({
      next: (response) => {
        this.#cart.set(response.data);
        this.#isLoading.set(false);
      },
      error: (err) => {
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || "Errore nel caricamento dei prodotti.";
        this.#error.set(msg);
        this.#isLoading.set(false);
      },
    });
  }

  addToCart(product: Product, quantity = 1) {

    const previouscart = this.#cart();

    this.#cart.update((c) => {
      if (!c) return c;

      const unitPrice = product.price * (1 - product.discount_percentage / 100.0);

      const existingItem = c.items.find(i => i.product_id === product.id);

      let updatedItems: CartItem[];

      if (existingItem) {
        updatedItems = c.items.map(item =>
          item.product_id === product.id
          ? {
              ...item, quantity: item.quantity + quantity
            }
          : item
        );
      } else {
        const newCartItem: CartItem = {
          product_id: product.id,
          quantity,
          unit_price: unitPrice,
        };

        updatedItems = [...c.items, newCartItem];
      }


      return {
        ...c,
        items: updatedItems,
      };
    });

    this.api.addToCart(product, quantity).subscribe({
      next: (response) => {
        this.#cart.set(response.data);
      },
      error: (err) => {
        // Rollback allo stato precedente in caso di errore nella chiamata
        this.#cart.set(previouscart);
        const msg =
          `${err?.error?.error} - ${err?.error?.exception}` || "Errore aggiornamento carrello";
        this.#error.set(msg);
      }
    });
  }
}
