import { computed, effect, inject, Injectable, signal } from "@angular/core";
import { CartApiService } from "../http/cart-api.service";
import { Cart, CartItem } from "../models/cart";
import Product from "../models/product";
import { CartStore } from "../state/cart.store";
import { Toaster } from "./toaster";

@Injectable({
  providedIn: "root",
})
export class CartService {
  private api = inject(CartApiService);
  private store = inject(CartStore);
  private toaster = inject(Toaster);

  #cart = signal<Cart | null>(this.store.cart());
  #error = signal<string | undefined>(undefined);

  cart = this.#cart.asReadonly();
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

    this.api.loadCart().subscribe({
      next: (response) => {
        this.#cart.set(response.data);
      },
      error: (err) => {
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || "Errore nel caricamento dei prodotti.";
        this.#error.set(msg);
      },
    });
  }

  addToCart(product: Product, quantity = 1) {

    const previousCart = this.#cart();

    this.#cart.update((c) => {
      if (!c) return c;

      const unitPrice = product.price * (1 - product.discount_percentage / 100.0);

      const existingItem = c.items.find(i => i.product.id === product.id);

      let updatedItems: CartItem[];

      if (existingItem) {
        updatedItems = c.items.map(item =>
          item.product.id === product.id
          ? {
              ...item, quantity: item.quantity + quantity
            }
          : item
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
        this.toaster.success("Prodotto aggiunto al tuo carrello"); 
      },
      error: (err) => {
        // Rollback allo stato precedente in caso di errore nella chiamata
        this.#cart.set(previousCart);
        const msg =
          `${err?.error?.error} - ${err?.error?.exception}` || "Errore durante aggiornamento del carrello";
        
        this.toaster.error(msg); 
        this.#error.set(msg);
      }
    });
  }

  removeFromCart(product: Product) {
    const previousCart = this.#cart();

    this.#cart.update((c) => {
      if (!c) return c;

      const existingItem = c.items.find((i) => i.product.id === product.id);
      let updatedItems = [...c.items];

      if (existingItem) {
        updatedItems = c.items.filter(ci => ci.product.id !== product.id);
      }

      this.api.removeFromCart(product).subscribe({
        next: (response) => {
          this.#cart.set(response.data);
          this.toaster.success("Prodotto rimosso dal tuo carrello");
        },
        error: (err) => {
          this.#cart.set(previousCart);
          const msg =
            `${err?.error?.error} - ${err?.error?.exception}` || "Errore durante aggiornamento del carrello";

          this.toaster.error(msg);
          this.#error.set(msg);
        }
      })


      return {
        ...c,
        items: updatedItems
      }
    });
  }

  /**
   * Metodo che si occupa solamente di svuotare il carrello senza fare una chiamata api.
   * Usato principalmente quando l'utente effettua un logout.
   */
  clearCart() {
    this.store.clearCart();
  }
}
