import { inject, Injectable } from '@angular/core';
import { CategoriesApiService } from '../http/categories-api.service';
import { CategoriesStore } from '../state/categories.store';

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private api = inject(CategoriesApiService);
  private store = inject(CategoriesStore);

  selected = this.store.selected;
  categories = this.store.items;
  paginationMeta = this.store.meta;
  isLoading = this.store.isLoading;
  error = this.store.error;

  loadCategories(page: number = 1, perPage: number = 10) {
    this.store.setLoading();

    this.api.getCategories(page, perPage).subscribe({
      next: (response) => {
        // Popolamento dello store con i dati di risposta e di paginazione
        this.store.setSuccess(response.data, response.meta!);
      },
      error: (err) => {
        // Gestione del messaggio di errore qualora si verifichi
        const msg =
          `${err?.error.error} - ${err?.error.exception}` || 'Errore nel caricamento delle categorie.';
        this.store.setError(msg);
      },
    });
  }
}
