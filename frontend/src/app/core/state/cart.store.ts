import { computed, effect, Injectable, signal } from "@angular/core";
import { Cart } from "../models/cart";

export interface CartState {
  cart: Cart | null;
}

@Injectable({
  providedIn: "root",
})
export class CartStore {
  #initialState: CartState = !!localStorage.getItem("sw-store-cart")
    ? JSON.parse(localStorage.getItem("sw-store-cart")!)
    : { cart: null };

  readonly #state = signal<CartState>(this.#initialState);

  readonly cart = computed(() => this.#state().cart);

  constructor() {
    effect(() => {
      const currentState = this.#state();

      if (currentState.cart) {
        localStorage.setItem("sw-store-cart", JSON.stringify(currentState));
      } else {
        localStorage.removeItem("sw-store-cart");
      }
    });
  }

  setCart(cart: Cart | null) {
    this.#state.set({ cart });
  }

  clearCart() {
    this.#state.set({ cart: null });
  }
}
