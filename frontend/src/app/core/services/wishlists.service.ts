import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { Subject, debounceTime, switchMap, tap } from "rxjs";
import { CartApiService } from "../http/cart-api.service";
import { Cart, CartItem } from "../models/cart";
import Product from "../models/product";
import { CartStore } from "../state/cart.store";
import { Toaster } from "./toaster";
import { WishlistsApiService } from "../http/wishlists-api.service";
import { WishlistStore } from "../state/wishlist.store";
import { Wishlist, WishlistItem } from "../models/wishlist";
import { ApiResponse } from "../models/api-types";
import { CartService } from "./cart.service";
import { getApiErrorMessage } from "../http/api-error";

@Injectable({
  providedIn: "root",
})
export class WishlistsService {
  private api = inject(WishlistsApiService);
  private store = inject(WishlistStore);
  private cartService = inject(CartService);
  private toaster = inject(Toaster);

  #wishlist = signal<Wishlist | null>(this.store.wishlist());
  #error = signal<string | undefined>(undefined);

  wishlist = this.#wishlist.asReadonly();
  error = this.#error.asReadonly();

  wishlistItemCount = computed(() => this.#wishlist()?.items.length ?? 0);

  constructor() {
    effect(() => {
      const wishlist = this.#wishlist();

      if (wishlist) {
        this.store.setWishlist(wishlist);
      }
    });
  }

  loadWishlist() {
    this.api.loadWishlist().subscribe({
      next: (response) => {
        this.#wishlist.set(response.data);
      },
      error: (err) => {
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@wishlistService.loadError:Errore nel caricamento della wishlist.`),
        );
      },
    });
  }

  addToWishlist(product: Product) {
    const previousWishlist = this.#wishlist();

    this.#wishlist.update((wl) => {
      if (!wl) return wl;

      const existingItem = wl.items.find((i) => i.product.id === product.id);

      let updatedItems: WishlistItem[] = [...wl.items];
      if (!existingItem) {
        updatedItems = [...wl.items, { id: Math.random(), product }];
      }

      return {
        ...wl,
        items: updatedItems,
      };
    });

    this.api.addToWishlist(product).subscribe({
      next: (response) => {
        this.#wishlist.set(response.data);
        this.toaster.success(response.message || $localize`:@@toast.addedToWishlist:Prodotto aggiunto alla tua wishlist`);
      },
      error: (err) => {
        // Rollback allo stato precedente in caso di errore nella chiamata
        this.#wishlist.set(previousWishlist);
        const msg = getApiErrorMessage(err, $localize`:@@wishlistService.updateError:Errore durante l'aggiornamento della wishlist.`);

        this.toaster.error(msg);
        this.#error.set(msg);
      },
    });
  }

  removeFromWishlist(product: Product) {
    const previousWishlist = this.#wishlist();

    this.#wishlist.update((wl) => {
      if (!wl) return wl;

      const existingItem = wl.items.find((i) => i.product.id === product.id);
      let updatedItems = [...wl.items];

      if (existingItem) {
        updatedItems = wl.items.filter((ci) => ci.product.id !== product.id);
      }

      this.api.removeFromWishlist(product).subscribe({
        next: (response) => {
          this.#wishlist.set(response.data);
          this.toaster.success(response.message || $localize`:@@toast.removedFromWishlist:Prodotto rimosso dalla tua wishlist`);
        },
        error: (err) => {
          this.#wishlist.set(previousWishlist);
          const msg = getApiErrorMessage(err, $localize`:@@wishlistService.updateError:Errore durante l'aggiornamento della wishlist.`);

          this.toaster.error(msg);
          this.#error.set(msg);
        },
      });

      return {
        ...wl,
        items: updatedItems,
      };
    });
  }

  moveToCart(product: Product) {
    const previousWishlist = this.#wishlist();

    this.#wishlist.update((wl) => {
      if (!wl) return wl;

      const existingItem = wl.items.find((i) => i.product.id === product.id);
      let updatedItems = [...wl.items];

      if (existingItem) {
        updatedItems = wl.items.filter((ci) => ci.product.id !== product.id);
      }
      
      this.api.moveToCart(product).subscribe({
        next: (response) => {
          this.#wishlist.set(response.data);
          this.cartService.loadCart();
          this.toaster.success(response.message || $localize`:@@toast.movedToCart:Prodotto spostato nel carrello`);
        },
        error: (err) => {
          this.#wishlist.set(previousWishlist);
          const msg = getApiErrorMessage(
            err,
            $localize`:@@wishlistService.moveToCartError:Errore durante lo spostamento del prodotto nel carrello.`,
          );
          this.toaster.error(msg);
          this.#error.set(msg);
        },
      });

      return {
        ...wl,
        items: updatedItems,
      };
    });
  }

  /**
   * Metodo che si occupa solamente di svuotare la wishlist senza fare una chiamata api.
   * Usato principalmente quando l'utente effettua un logout, o la sessione è scaduta.
   */
  clearWishlist() {
    this.store.clearWishlist();
    this.#wishlist.set(null);
  }
}
