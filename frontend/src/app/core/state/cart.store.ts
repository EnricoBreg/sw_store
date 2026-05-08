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
      localStorage.setItem("sw-store-cart", JSON.stringify(this.#state()));
    });
  }

  setCart(cart: Cart) {
    this.#state.set({ cart });
  }

  clearCart() {
    this.#state.set({ cart: null });
  }
}
