import { inject, Injectable, signal } from "@angular/core";
import { Observable, tap } from "rxjs";
import { AdminCategoriesApiService, CategoryPayload } from "../http/admin-categories-api.service";
import { getApiError, getApiErrorDetail } from "../http/api-error";
import { ApiResponse } from "../models/api-types";
import Category from "../models/category";
import { Toaster } from "./toaster";

@Injectable({
  providedIn: "root",
})
export class AdminCategoriesService {
  private readonly api = inject(AdminCategoriesApiService);
  private readonly toaster = inject(Toaster);

  readonly #categories = signal<Category[]>([]);
  readonly #loaded = signal(false);
  readonly #error = signal<{ message: string; errors: string[] } | undefined>(undefined);

  readonly categories = this.#categories.asReadonly();
  readonly loaded = this.#loaded.asReadonly();
  readonly error = this.#error.asReadonly();

  loadCategories() {
    this.api.getAll().subscribe({
      next: (response) => {
        this.#error.set(undefined);
        this.#categories.set(response.data);
        this.#loaded.set(true);
      },
      error: (err) => {
        this.#error.set(
          getApiError(err, $localize`:@@categoriesService.loadError:Errore nel caricamento delle categorie.`),
        );
        this.#loaded.set(true);
      },
    });
  }

  /**
   * Crea o modifica una categoria. Restituisce l'Observable così il dialog del form può
   * restare aperto e mostrare gli errori 422 del backend (es. nome già usato).
   */
  save(category: CategoryPayload, categoryId?: number): Observable<ApiResponse<Category>> {
    const request = categoryId ? this.api.update(categoryId, category) : this.api.create(category);
    return request.pipe(
      tap((response) => {
        this.toaster.success(
          response.message || $localize`:@@adminCategories.saved:Categoria salvata con successo.`,
        );
        this.loadCategories();
      }),
    );
  }

  /** Elimina una categoria. Se contiene prodotti il backend risponde 409 con il motivo. */
  delete(category: Category) {
    this.api.delete(category.id).subscribe({
      next: (response) => {
        this.toaster.success(
          response.message || $localize`:@@adminCategories.deleted:Categoria eliminata con successo.`,
        );
        this.loadCategories();
      },
      error: (err) => {
        this.toaster.error(
          getApiErrorDetail(err, $localize`:@@adminCategories.deleteError:Impossibile eliminare la categoria.`),
        );
      },
    });
  }
}
