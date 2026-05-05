import { computed, Injectable, signal } from '@angular/core';
import Product from '../models/product';
import { PaginationMeta } from '../models/api-types';

interface ProductsState {
  items: Product[];
  meta?: PaginationMeta;
  isLoading: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class ProductsStore {
  // Stato privato non accessibile dall'esterno
  private state = signal<ProductsState>({
    items: [],
    isLoading: false,
  });

  // Esposizione read-only dei dati
  readonly items = computed(() => this.state().items);
  readonly meta = computed(() => this.state().meta);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  // Reducers per la modifica dello stato interno
  setLoading() {
    this.state.update((s) => ({ ...s, isLoading: true, error: undefined }));
  }

  setSuccess(items: Product[], meta: PaginationMeta) {
    this.state.update((s) => ({ ...s, items, meta, isLoading: false, error: undefined }));
  }

  setError(error: string) {
    this.state.update((s) => ({ ...s, isLoading: false, error }));
  }
}
