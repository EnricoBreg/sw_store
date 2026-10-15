import { inject, Injectable, signal } from '@angular/core';
import { CategoriesApiService } from '../http/categories-api.service';
import Category from '../models/category';
import { PaginationMeta } from '../models/api-types';
import { getApiErrorMessage } from "../http/api-error";

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private api = inject(CategoriesApiService);

  #categories = signal<Category[]>([]);
  #selected = signal<Category | undefined>(undefined);
  #paginationMeta = signal<PaginationMeta | undefined>(undefined);
  #error = signal<string | undefined>(undefined);

  categories = this.#categories.asReadonly();
  selected = this.#selected.asReadonly();
  error = this.#error.asReadonly();

  loadCategories(page: number = 1, perPage: number = 10) {

    this.api.getCategories(page, perPage).subscribe({
      next: (response) => {
        // Popolamento dello store con i dati di risposta e di paginazione
        this.#categories.set(response.data);
        this.#paginationMeta.set(response.meta);
      },
      error: (err) => {
        // Gestione del messaggio di errore qualora si verifichi
        this.#error.set(
          getApiErrorMessage(err, $localize`:@@categoriesService.loadError:Errore nel caricamento delle categorie.`),
        );
      },
    });
  }

  setSelectedCategory(category?: number) {
    const selectedCategory = this.#categories().find((c) => c.id === category);
    this.#selected.set(selectedCategory);
  }
}
