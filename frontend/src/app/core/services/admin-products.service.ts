import { inject, Injectable, signal } from "@angular/core";
import { Router } from "@angular/router";
import { AdminProductsApiService } from "../http/admin-products-api.service";
import { getApiError, getApiErrorDetail, getApiErrorMessage, getApiErrorStatus } from "../http/api-error";
import { PaginationMeta } from "../models/api-types";
import Product from "../models/product";
import { ProductsQuery } from "./products.service";
import { Toaster } from "./toaster";

export interface AdminProductsError {
  message: string;
  errors: string[];
}

@Injectable({
  providedIn: "root",
})
export class AdminProductsService {
  private readonly api = inject(AdminProductsApiService);
  private readonly router = inject(Router);
  private readonly toaster = inject(Toaster);

  // Esposizione dei signals in modo trasparente al componente che li userà
  readonly #products = signal<Product[]>([]);
  readonly #product = signal<Product | null>(null);
  readonly #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  readonly #error = signal<string | undefined>(undefined);
  // Errori del form prodotto (422: validazioni, tipo/dimensione dell'immagine)
  readonly #formError = signal<AdminProductsError | undefined>(undefined);
  readonly #saving = signal(false);

  readonly products = this.#products.asReadonly();
  readonly product = this.#product.asReadonly();
  readonly paginationMeta = this.#paginationMeta.asReadonly();
  readonly error = this.#error.asReadonly();
  readonly formError = this.#formError.asReadonly();
  readonly saving = this.#saving.asReadonly();

  loadProducts(page: number = 1, perPage: number = 10, searchQuery?: ProductsQuery) {
    this.api.getProducts(page, perPage, searchQuery).subscribe({
      next: (response) => {
        // Popolamento dello store con i dati di risposta e di paginazione
        this.#error.set(undefined);
        this.#products.set(response.data);
        this.#paginationMeta.set(response.meta);
      },
      error: (err) => {
        // Gestione del messaggio di errore qualora si verifichi
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@productsService.loadError:Errore nel caricamento dei prodotti.`),
        );
      },
    });
  }

  getById(productId: number) {
    // Niente dati del prodotto precedente mentre si carica il nuovo
    this.#product.set(null);
    this.#error.set(undefined);

    this.api.getById(productId).subscribe({
      next: (response) => {
        this.#product.set(response.data);
      },
      error: (err) => {
        // Il prodotto non esiste: la pagina di dettaglio non ha senso, si mostra "non trovato"
        if (getApiErrorStatus(err) === 404) {
          this.router.navigate(["/not-found"]);
          return;
        }
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@productsService.loadProductError:Errore nel caricamento del prodotto.`),
        );
      },
    });
  }

  /** Azzera gli errori del form (all'apertura della pagina di creazione o modifica). */
  resetForm() {
    this.#formError.set(undefined);
    this.#saving.set(false);
  }

  createProduct(formData: FormData) {
    this.save(this.api.create(formData), {
      success: $localize`:@@toast.productCreated:Prodotto creato con successo.`,
      error: $localize`:@@adminProductsService.createError:Errore nella creazione del nuovo prodotto.`,
    });
  }

  updateProduct(productId: number, formData: FormData) {
    this.save(this.api.update(productId, formData), {
      success: $localize`:@@toast.productUpdated:Prodotto aggiornato con successo.`,
      error: $localize`:@@adminProductsService.updateError:Errore nell'aggiornamento del prodotto.`,
    });
  }

  /**
   * Elimina un prodotto. Se è già stato ordinato il backend risponde 409 con il motivo:
   * il prodotto resta e il messaggio viene mostrato all'utente.
   */
  deleteProduct(product: Product) {
    this.api.delete(product.id).subscribe({
      next: (response) => {
        this.toaster.success(
          response.message || $localize`:@@adminProducts.deleted:Prodotto eliminato con successo.`,
        );
        this.router.navigate(["/admin/products"]);
      },
      error: (err) => {
        const message = getApiErrorDetail(
          err,
          $localize`:@@adminProducts.deleteError:Impossibile eliminare il prodotto.`,
        );
        this.#error.set(message);
        this.toaster.error(message);
      },
    });
  }

  private save(
    request: ReturnType<AdminProductsApiService["create"]>,
    messages: { success: string; error: string },
  ) {
    this.#saving.set(true);
    this.#formError.set(undefined);

    request.subscribe({
      next: (response) => {
        this.#saving.set(false);
        this.#product.set(response.data);
        this.toaster.success(response.message || messages.success);
        this.router.navigate(["/admin/products", response.data.id]);
      },
      error: (err) => {
        this.#saving.set(false);
        const error = getApiError(err, messages.error);
        this.#formError.set(error);
        this.toaster.error(error.message);
      },
    });
  }
}
