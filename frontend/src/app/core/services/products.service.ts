import { inject, Injectable } from '@angular/core';
import { ProductsApiService } from '../http/products-api.service';
import { ProductsStore } from '../state/products.store';

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private api = inject(ProductsApiService);
  private store = inject(ProductsStore);

  // Esposizione dei signals in modo trasparente al componente che li userà
  products = this.store.items;
  paginationMeta = this.store.meta;
  isLoading = this.store.isLoading;
  error = this.store.error;

  loadProducts(page: number = 1, perPage: number = 10) {
    this.store.setLoading();

    this.api.getProducts(page, perPage).subscribe({
      next: (response) => {
        // Popolamento dello store con i dati di risposta e di paginazione
        this.store.setSuccess(response.data, response.meta!);
      },
      error: (err) => {
        // Gestione del messaggio di errore qualora si verifichi
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || 'Errore nel caricamento dei prodotti.';
        this.store.setError(msg);
      },
    });
  }
}
