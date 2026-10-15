import { inject, Injectable, signal } from '@angular/core';
import { CategoriesApiService } from '../http/categories-api.service';
import Category from '../models/category';
import { getApiErrorMessage } from "../http/api-error";

@Injectable({
  providedIn: 'root',
})
export class CategoriesService {
  private api = inject(CategoriesApiService);

  #categories = signal<Category[]>([]);
  #selected = signal<Category | undefined>(undefined);
  #error = signal<string | undefined>(undefined);

  categories = this.#categories.asReadonly();
  selected = this.#selected.asReadonly();
  error = this.#error.asReadonly();

  /** Carica tutte le categorie (lista laterale del catalogo e select dei form). */
  loadCategories() {
    this.api.getAll().subscribe({
      next: (response) => {
        this.#error.set(undefined);
        this.#categories.set(response.data);
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
