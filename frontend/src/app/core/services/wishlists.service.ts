import { computed, inject, Injectable, signal } from "@angular/core";
import { Observable } from "rxjs";
import { WishlistsApiService } from "../http/wishlists-api.service";
import { getApiErrorDetail, getApiErrorMessage } from "../http/api-error";
import { ApiResponse } from "../models/api-types";
import Product from "../models/product";
import { Wishlist } from "../models/wishlist";
import { CartService } from "./cart.service";
import { Toaster } from "./toaster";

/**
 * Stato della wishlist: come per il carrello, la fonte di verità è il backend e lo stato
 * viene sostituito con la wishlist restituita a ogni risposta. Mentre una richiesta è in corso
 * il prodotto risulta "in attesa", così l'interfaccia può disabilitare i pulsanti.
 */
@Injectable({
  providedIn: "root",
})
export class WishlistsService {
  private readonly api = inject(WishlistsApiService);
  private readonly cartService = inject(CartService);
  private readonly toaster = inject(Toaster);

  readonly #wishlist = signal<Wishlist | null>(null);
  readonly #pendingProductIds = signal<ReadonlySet<number>>(new Set());
  readonly #error = signal<string | undefined>(undefined);

  readonly wishlist = this.#wishlist.asReadonly();
  readonly error = this.#error.asReadonly();

  readonly wishlistItemCount = computed(() => this.#wishlist()?.items.length ?? 0);

  isInWishlist(productId: number): boolean {
    return !!this.#wishlist()?.items.some((item) => item.product.id === productId);
  }

  isPending(productId: number): boolean {
    return this.#pendingProductIds().has(productId);
  }

  loadWishlist() {
    this.api.loadWishlist().subscribe({
      next: (response) => {
        this.#error.set(undefined);
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
    this.run(product, this.api.addToWishlist(product), {
      success: $localize`:@@toast.addedToWishlist:Prodotto aggiunto alla tua wishlist`,
      error: $localize`:@@wishlistService.updateError:Errore durante l'aggiornamento della wishlist.`,
    });
  }

  removeFromWishlist(product: Product) {
    this.run(product, this.api.removeFromWishlist(product), {
      success: $localize`:@@toast.removedFromWishlist:Prodotto rimosso dalla tua wishlist`,
      error: $localize`:@@wishlistService.updateError:Errore durante l'aggiornamento della wishlist.`,
    });
  }

  /** Sposta un pezzo del prodotto nel carrello: il backend lo toglie dalla wishlist solo se l'aggiunta riesce. */
  moveToCart(product: Product) {
    this.run(
      product,
      this.api.moveToCart(product),
      {
        success: $localize`:@@toast.movedToCart:Prodotto spostato nel carrello`,
        error: $localize`:@@wishlistService.moveToCartError:Errore durante lo spostamento del prodotto nel carrello.`,
      },
      // La risposta contiene solo la wishlist: il carrello va riletto
      () => this.cartService.loadCart(),
    );
  }

  /** Svuota lo stato locale senza chiamate API (logout, sessione scaduta). */
  clearWishlist() {
    this.#wishlist.set(null);
    this.#pendingProductIds.set(new Set());
    this.#error.set(undefined);
  }

  private run(
    product: Product,
    request: Observable<ApiResponse<Wishlist>>,
    messages: { success: string; error: string },
    onSuccess?: () => void,
  ) {
    if (this.isPending(product.id)) return;
    this.setPending(product.id, true);

    request.subscribe({
      next: (response) => {
        this.setPending(product.id, false);
        this.#error.set(undefined);
        this.#wishlist.set(response.data);
        onSuccess?.();
        this.toaster.success(response.message || messages.success);
      },
      error: (err) => {
        this.setPending(product.id, false);
        const message = getApiErrorDetail(err, messages.error);
        this.#error.set(message);
        this.toaster.error(message);
      },
    });
  }

  private setPending(productId: number, pending: boolean) {
    this.#pendingProductIds.update((ids) => {
      const next = new Set(ids);
      if (pending) next.add(productId);
      else next.delete(productId);
      return next;
    });
  }
}
