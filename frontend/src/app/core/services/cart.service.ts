import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { CartApiService } from "../http/cart-api.service";
import { Cart, CartItem } from "../models/cart";
import Product from "../models/product";
import { CartStore } from "../state/cart.store";
import { Toaster } from "./toaster";
import { debounceTime, Subject, switchMap, tap } from "rxjs";
import { getApiErrorMessage } from "../http/api-error";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private api = inject(CartApiService);
  private store = inject(CartStore);
  private toaster = inject(Toaster);

  #cart = signal<Cart | null>(this.store.cart());
  #error = signal<string | undefined>(undefined);
  #updateQtySubject = new Subject<{
    cartItem: CartItem;
    newQuantity: number;
    previousCart: Cart | null;
  }>();

  cart = this.#cart.asReadonly();
  error = this.#error.asReadonly();

  cartItemCount = computed(() => this.#cart()?.items.length ?? 0);
  cartEmpty = computed(() => (this.#cart()?.items.length ?? 0) === 0);

  constructor() {
    effect(() => {
      const cart = this.#cart();

      if (cart) {
        this.store.setCart(cart);
      }
    });

    this.#updateQtySubject
      .pipe(
        // attesa di 500ms tra un click e l'altro
        debounceTime(500),

        // Viene considerata solamente l'ultima richiesta e vengono ignorate quelle precedenti
        switchMap(({ cartItem, newQuantity, previousCart }) =>
          this.api.updateQuantity(cartItem.product, newQuantity).pipe(
            tap({
              next: () => this.toaster.success($localize`:@@toast.quantityUpdated:Quantità aggiornata.`),
              error: (err) => {
                this.#cart.set(previousCart);
                this.toaster.error(getApiErrorMessage(err, $localize`:@@cartService.updateError:Errore durante l'aggiornamento del carrello.`));
              },
            }),
          ),
        ),
      )
      .subscribe();
  }

  loadCart() {
    this.api.loadCart().subscribe({
      next: (response) => {
        this.#cart.set(response.data);
      },
      error: (err) => {
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@cartService.loadError:Errore nel caricamento del carrello.`),
        );
      },
    });
  }

  addToCart(product: Product, quantity = 1) {
    const previousCart = this.#cart();

    this.#cart.update((c) => {
      if (!c) return c;

      const unitPrice = product.price * (1 - product.discount_percentage / 100.0);

      const existingItem = c.items.find((i) => i.product.id === product.id);

      let updatedItems: CartItem[];

      if (existingItem) {
        updatedItems = c.items.map((item) =>
          item.product.id === product.id
            ? {
                ...item,
                quantity: item.quantity + quantity,
              }
            : item,
        );
      } else {
        const newCartItem: CartItem = {
          product,
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
        this.toaster.success($localize`:@@toast.addedToCart:Prodotto aggiunto al tuo carrello`);
      },
      error: (err) => {
        // Rollback allo stato precedente in caso di errore nella chiamata
        this.#cart.set(previousCart);
        const msg = getApiErrorMessage(err, $localize`:@@cartService.updateError:Errore durante l'aggiornamento del carrello.`);

        this.toaster.error(msg);
        this.#error.set(msg);
      },
    });
  }

  removeFromCart(product: Product) {
    const previousCart = this.#cart();

    this.#cart.update((c) => {
      if (!c) return c;

      const existingItem = c.items.find((i) => i.product.id === product.id);
      let updatedItems = [...c.items];

      if (existingItem) {
        updatedItems = c.items.filter((ci) => ci.product.id !== product.id);
      }

      this.api.removeFromCart(product).subscribe({
        next: (response) => {
          this.#cart.set(response.data);
          this.toaster.success($localize`:@@toast.removedFromCart:Prodotto rimosso dal tuo carrello`);
        },
        error: (err) => {
          this.#cart.set(previousCart);
          const msg = getApiErrorMessage(err, $localize`:@@cartService.updateError:Errore durante l'aggiornamento del carrello.`);

          this.toaster.error(msg);
          this.#error.set(msg);
        },
      });

      return {
        ...c,
        items: updatedItems,
      };
    });
  }

  updateCartItemQuantity(cartItem: CartItem, newQuantity: number) {
    const previousCart = this.#cart();

    this.#cart.update((c) => {
      if (!c) return c;
      const updatedItems = c.items.map((ci) =>
        ci.product.id === cartItem.product.id ? { ...ci, quantity: newQuantity } : ci,
      );
      return { ...c, items: updatedItems };
    });

    this.#updateQtySubject.next({ cartItem, newQuantity, previousCart });
  }

  /**
   * Metodo che si occupa solamente di svuotare il carrello senza fare una chiamata api.
   * Usato principalmente quando l'utente effettua un logout, o la sessione è scaduta.
   */
  clearCart() {
    this.store.clearCart();
    this.#cart.set(null);
  }
}
