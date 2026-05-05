import { computed, Injectable, signal } from '@angular/core';
import Category from '../models/category';
import { PaginationMeta } from '../models/api-types';

interface CategoriesState {
  selected?: Category;
  items: Category[];
  meta?: PaginationMeta;
  isLoading: boolean;
  error?: string;
}

@Injectable({
  providedIn: 'root',
})
export class CategoriesStore {
  private state = signal<CategoriesState>({
    items: [],
    isLoading: false,
  });

  readonly selected = computed(() => this.state().selected);
  readonly items = computed(() => this.state().items);
  readonly meta = computed(() => this.state().meta);
  readonly isLoading = computed(() => this.state().isLoading);
  readonly error = computed(() => this.state().error);

  setSelected(categoryId?: number) {
    const selectedCategory = this.state().items.find(c => c.id === categoryId);
    this.state.update((s) => ({ ...s, selected: selectedCategory }));
  }

  setLoading() {
    this.state.update((s) => ({ ...s, isLoading: true, error: undefined }));
  }
  
  setSuccess(items: Category[], meta: PaginationMeta) {
    this.state.update((s) => ({ ...s, items, meta, isLoading: false, error: undefined }));
  }

  setError(error: string) {
    this.state.update((s) => ({ ...s, isLoading: false, error }));
  }
}
