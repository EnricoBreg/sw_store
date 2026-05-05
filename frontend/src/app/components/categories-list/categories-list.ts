import { TitleCasePipe } from '@angular/common';
import { Component, inject, input, output, signal } from '@angular/core';
import { MatNavList, MatListItem, MatListItemTitle } from "@angular/material/list"
import { CategoriesService } from '../../core/services/categories.service';
import Spinner from '../spinner/spinner';
import { CategoriesStore } from '../../core/state/categories.store';

@Component({
  selector: 'app-categories-list',
  imports: [MatNavList, MatListItem, MatListItemTitle, TitleCasePipe, Spinner],
  template: `
    <div>
      @if (isLoading()) {
        <app-spinner />
      }

      @if (errorMessage()) {
        <div class="text-red-500 text-lg">
          {{ errorMessage() }}
        </div>
      }

      <mat-nav-list>
        <mat-list-item
          class="my-2"
          [activated]="!selectedCategory()"
          (click)="onCategorySelectEvent({ id: undefined, name: undefined })"
        >
          <span matListItemTitle class="font-medium"> Tutte </span>
        </mat-list-item>
        @for (category of categories(); track category) {
          <mat-list-item
            class="my-2"
            [activated]="category.id === selectedCategory()?.id"
            (click)="onCategorySelectEvent({ id: category.id, name: category.name })"
          >
            <span matListItemTitle class="font-medium">
              {{ category.name | titlecase }}
            </span>
          </mat-list-item>
        }
      </mat-nav-list>
    </div>
  `,
  styles: ``,
})
export default class CategoriesList {
  categorySelectEvent = output<{ id?: number; name?: string }>();

  private store = inject(CategoriesStore);
  private categoriesService = inject(CategoriesService);

  selectedCategory = this.categoriesService.selected;
  categories = this.categoriesService.categories;
  pagination = this.categoriesService.paginationMeta;
  isLoading = this.categoriesService.isLoading;
  errorMessage = this.categoriesService.error;

  ngOnInit() {
    this.categoriesService.loadCategories();
  }

  onCategorySelectEvent(event: { id?: number; name?: string }) {
    this.store.setSelected(event?.id);
    this.categorySelectEvent.emit({
      id: event.id,
      name: event.name,
    });
  }
}
