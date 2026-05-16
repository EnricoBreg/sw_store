import { inject, Injectable, signal } from '@angular/core';
import { ProductsApiService } from '../http/products-api.service';
import Product from '../models/product';
import { PaginationMeta } from '../models/api-types';
import { Router } from '@angular/router';
import { Toaster } from './toaster';

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
  private readonly toaster = inject(Toaster);

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
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || 'Errore nel caricamento dei prodotti.';
        this.#error.set(msg);
      },
    });
  }

  getById(productId: number) {
    this.api.getById(productId).subscribe({
      next: (response) => {
        this.#product.set(response.data);
      },
      error: (err) => {
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || "Errore nel caricamento dei prodotti.";
        this.#error.set(msg);
      }
    })
  }
}
