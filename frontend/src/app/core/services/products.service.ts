import { inject, Injectable, signal } from '@angular/core';
import { ProductsApiService } from '../http/products-api.service';
import Product from '../models/product';
import { PaginationMeta } from '../models/api-types';
import { Router } from '@angular/router';
import { Toaster } from './toaster';
import { getApiErrorMessage, getApiErrorStatus } from "../http/api-error";

export interface ProductsQuery {
  searchTerm?: string;
  categoryId?: number;
  orderBy?: string;
  orderDirection?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsService {
  private readonly api = inject(ProductsApiService);
  private readonly router = inject(Router);

  // Esposizione dei signals in modo trasparente al componente che li userà
  #products = signal<Product[]>([]);
  #product = signal<Product | null>(null);
  #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  #error = signal<string | undefined>(undefined);

  products = this.#products.asReadonly();
  product = this.#product.asReadonly();
  paginationMeta = this.#paginationMeta.asReadonly();
  error = this.#error.asReadonly();

  loadProducts(page: number = 1, perPage: number = 10, searchQuery?: ProductsQuery) {

    this.api.getProducts(page, perPage, searchQuery).subscribe({
      next: (response) => {
        // Popolamento dello store con i dati di risposta e di paginazione
        this.#products.set(response.data);
        this.#paginationMeta.set(response.meta);
      },
      error: (err) => {
        // Gestione del messaggio di errore qualora si verifichi
        this.#error.set(getApiErrorMessage(err, $localize`:@@productsService.loadError:Errore nel caricamento dei prodotti.`));
      },
    });
  }

  getById(productId: number) {
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
      }
    })
  }
}
