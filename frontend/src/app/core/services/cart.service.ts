import { computed, inject, Injectable, signal } from "@angular/core";
import { catchError, debounceTime, EMPTY, groupBy, mergeMap, Subject, switchMap, tap } from "rxjs";
import { CartApiService } from "../http/cart-api.service";
import { getApiErrorDetail, getApiErrorMessage } from "../http/api-error";
import { Cart, CartItem } from "../models/cart";
import Product from "../models/product";
import { Toaster } from "./toaster";

// Attesa (ms) dopo l'ultimo click sul selettore di quantità prima di inviare il PATCH
export const QUANTITY_DEBOUNCE_MS = 400;

/**
 * Stato del carrello: la fonte di verità è il backend (GET /cart).
 *
 * Scelta: lo stato viene sostituito con il carrello restituito dal server a ogni risposta
 * (aggiunta, modifica, rimozione), così prezzi, totali e regole di stock sono sempre quelli
 * calcolati dal backend, senza ricalcoli lato client. Solo la quantità di una riga viene
 * mostrata subito (ottimistica) mentre l'utente clicca: il PATCH parte dopo il debounce e,
 * in caso di errore, la quantità mostrata torna quella del server (rollback).
 */
@Injectable({
  providedIn: "root",
})
export class CartService {
  private readonly api = inject(CartApiService);
  private readonly toaster = inject(Toaster);

  // Ultimo carrello confermato dal backend
  readonly #serverCart = signal<Cart | null>(null);
  // Quantità scelte dall'utente e non ancora confermate (id riga -> quantità)
  readonly #pendingQuantities = signal<Readonly<Record<number, number>>>({});
  readonly #error = signal<string | undefined>(undefined);

  readonly #quantityChanges = new Subject<{ item: CartItem; quantity: number }>();

  /** Carrello da mostrare: quello del server, con le quantità in attesa di conferma. */
  readonly cart = computed<Cart | null>(() => {
    const cart = this.#serverCart();
    const pending = this.#pendingQuantities();
    if (!cart) return null;

    return {
      ...cart,
      items: cart.items.map((item) => (item.id in pending ? { ...item, quantity: pending[item.id] } : item)),
    };
  });
  readonly error = this.#error.asReadonly();

  /** Numero di pezzi nel carrello (dal backend). */
  readonly itemsCount = computed(() => this.#serverCart()?.items_count ?? 0);
  readonly totalAmount = computed(() => this.#serverCart()?.total_amount ?? 0);
  readonly isEmpty = computed(() => (this.#serverCart()?.items.length ?? 0) === 0);
  /** Vero finché ci sono modifiche di quantità non ancora confermate dal backend. */
  readonly hasPendingChanges = computed(() => Object.keys(this.#pendingQuantities()).length > 0);

  constructor() {
    // Un flusso per riga: il debounce di una riga non cancella le modifiche delle altre,
    // e per la stessa riga conta solo l'ultima quantità scelta (switchMap).
    this.#quantityChanges
      .pipe(
        groupBy(({ item }) => item.id),
        mergeMap((changes) =>
          changes.pipe(
            debounceTime(QUANTITY_DEBOUNCE_MS),
            switchMap(({ item, quantity }) => this.sendQuantity(item, quantity)),
          ),
        ),
      )
      .subscribe();
  }

  /** Legge il carrello dal backend (all'avvio con sessione attiva e dopo il login). */
  loadCart() {
    this.api.loadCart().subscribe({
      next: (response) => {
        this.#error.set(undefined);
        this.#serverCart.set(response.data);
      },
      error: (err) => {
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@cartService.loadError:Errore nel caricamento del carrello.`),
        );
      },
    });
  }

  addToCart(product: Product, quantity = 1) {
    this.api.addToCart(product, quantity).subscribe({
      next: (response) => {
        this.#serverCart.set(response.data);
        this.toaster.success(
          response.message || $localize`:@@toast.addedToCart:Prodotto aggiunto al tuo carrello`,
        );
      },
      error: (err) => this.showError(err),
    });
  }

  /** Cambio di quantità dal selettore: mostrato subito, inviato al backend dopo il debounce. */
  updateQuantity(item: CartItem, quantity: number) {
    this.#pendingQuantities.update((pending) => ({ ...pending, [item.id]: quantity }));
    this.#quantityChanges.next({ item, quantity });
  }

  removeFromCart(item: CartItem) {
    this.api.removeFromCart(item).subscribe({
      next: (response) => {
        this.clearPending(item.id);
        this.#serverCart.set(response.data);
        this.toaster.success(
          response.message || $localize`:@@toast.removedFromCart:Prodotto rimosso dal tuo carrello`,
        );
      },
      error: (err) => this.showError(err),
    });
  }

  /** Svuota lo stato locale senza chiamate API (logout, sessione scaduta). */
  clearCart() {
    this.#serverCart.set(null);
    this.#pendingQuantities.set({});
    this.#error.set(undefined);
  }

  private sendQuantity(item: CartItem, quantity: number) {
    return this.api.updateQuantity(item, quantity).pipe(
      tap({
        next: (response) => {
          this.#serverCart.set(response.data);
          this.clearPending(item.id, quantity);
          this.toaster.success(response.message || $localize`:@@toast.quantityUpdated:Quantità aggiornata.`);
        },
        error: (err) => {
          // Rollback: la riga torna a mostrare la quantità confermata dal backend
          this.clearPending(item.id);
          this.showError(err);
        },
      }),
      // L'errore è già gestito: il flusso delle modifiche deve restare attivo
      catchError(() => EMPTY),
    );
  }

  /** Rimuove la quantità in attesa di una riga (solo se è ancora quella inviata, quando indicata). */
  private clearPending(itemId: number, sentQuantity?: number) {
    this.#pendingQuantities.update((pending) => {
      if (!(itemId in pending)) return pending;
      if (sentQuantity !== undefined && pending[itemId] !== sentQuantity) return pending;
      const { [itemId]: _, ...rest } = pending;
      return rest;
    });
  }

  private showError(err: unknown) {
    const message = getApiErrorDetail(
      err,
      $localize`:@@cartService.updateError:Errore durante l'aggiornamento del carrello.`,
    );
    this.#error.set(message);
    this.toaster.error(message);
  }
}
