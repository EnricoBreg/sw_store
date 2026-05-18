import { Component, inject, OnInit, output } from "@angular/core";
import {
  MatFormField,
  MatLabel,
  MatSelect,
  MatOption,
  MatSelectChange,
  MatSuffix,
} from "@angular/material/select";
import { CategoriesService } from "../../core/services/categories.service";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";

@Component({
  selector: "app-category-select",
  imports: [MatFormField, MatLabel, MatSelect, MatOption, MatSuffix, MatIconButton, MatIcon],
  template: `
    <mat-form-field>
      <mat-label>Categoria prodotto</mat-label>
      <mat-select (selectionChange)="onCategorySelection($event)">
        @for (cat of categories(); track cat.id) {
          <mat-option [value]="cat.id">
            <p>{{ cat.name }}</p>
          </mat-option>
        }
      </mat-select>
      @if (selectedCategoryId) {
        <button
          matIconButton
          matSuffix
          (click)="clearSelection($event)"
          aria-label="Cancella selezione"
          class="mr-2"
        >
          <mat-icon>close</mat-icon>
        </button>
      }
    </mat-form-field>
  `,
  styles: ``,
})
export default class CategorySelect implements OnInit {
  private readonly service = inject(CategoriesService);

  readonly categories = this.service.categories;

  selectedCategoryId: number | null = null;

  categorySelected = output<number | null>();

  ngOnInit() {
    this.service.loadCategories();
  }

  onCategorySelection(event: MatSelectChange) {
    this.selectedCategoryId = event.value;
    this.categorySelected.emit(event.value);
  }

  clearSelection(event: MouseEvent) {
    event.stopImmediatePropagation(); // Impedisce al click di propagarsi e riaprire il menu a tendina
    this.selectedCategoryId = null;
    this.categorySelected.emit(null);
  }
}
