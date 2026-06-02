import { computed, effect, Injectable, signal } from "@angular/core";
import { Cart } from "../models/cart";
import { Wishlist } from "../models/wishlist";

export interface WishlistState {
  wishlist: Wishlist | null;
}

@Injectable({
  providedIn: "root",
})
export class WishlistStore {
  readonly key = "sw-store-wishlist";

  #initialState: WishlistState = !!localStorage.getItem(this.key)
    ? JSON.parse(localStorage.getItem(this.key)!)
    : { wishlist: null };

  readonly #state = signal<WishlistState>(this.#initialState);

  readonly wishlist = computed(() => this.#state().wishlist);

  constructor() {
    effect(() => {
      const currentState = this.#state();

      if (currentState.wishlist) {
        localStorage.setItem(this.key, JSON.stringify(currentState));
      } else {
        localStorage.removeItem(this.key);
      }
    });
  }

  setWishlist(wishlist: Wishlist | null) {
    this.#state.set({ wishlist });
  }

  clearWishlist() {
    this.#state.set({ wishlist: null });
  }
}
