import { inject, Injectable, signal } from '@angular/core';
import { ProductsApiService } from '../http/products-api.service';
import Product from '../models/product';
import { PaginationMeta } from '../models/api-types';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private api = inject(ProductsApiService);

  // Esposizione dei signals in modo trasparente al componente che li userà
  #products = signal<Product[]>([]);
  #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  #isLoading = signal<boolean>(false);
  #error = signal<string | undefined>(undefined);

  products = this.#products.asReadonly();
  paginationMeta = this.#paginationMeta.asReadonly();
  isLoading = this.#isLoading.asReadonly();
  error = this.#error.asReadonly();

  loadProducts(page: number = 1, perPage: number = 10, categoryId?: number) {
    this.#isLoading.set(true);

    this.api.getProducts(page, perPage, categoryId).subscribe({
      next: (response) => {
        // Popolamento dello store con i dati di risposta e di paginazione
        this.#products.set(response.data);
        this.#paginationMeta.set(response.meta);
        this.#isLoading.set(false);
      },
      error: (err) => {
        // Gestione del messaggio di errore qualora si verifichi
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || 'Errore nel caricamento dei prodotti.';
        this.#error.set(msg);
        this.#isLoading.set(false);
      },
    });
  }
}
