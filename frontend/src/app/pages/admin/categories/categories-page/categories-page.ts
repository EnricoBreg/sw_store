import { Component, inject, OnInit } from "@angular/core";
import { MatDialog } from "@angular/material/dialog";
import { MatButton, MatIconButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { MatTooltip } from "@angular/material/tooltip";
import { AdminCategoriesService } from "../../../../core/services/admin-categories.service";
import Category from "../../../../core/models/category";
import CategoryFormDialog from "../../../../components/category-form-dialog/category-form-dialog";
import ConfirmDialog, { ConfirmDialogData } from "../../../../components/confirm-dialog/confirm-dialog";
import { ErrorPanel } from "../../../../core/directives/error-panel";

@Component({
  selector: "app-categories-page",
  imports: [MatButton, MatIconButton, MatIcon, MatTooltip, ErrorPanel],
  template: `
    <div class="flex flex-wrap items-center justify-between gap-3 mb-4">
      <div>
        <h1 class="text-2xl font-semibold" i18n="@@adminCategories.title">Categorie</h1>
        <p class="text-gray-600" i18n="@@adminCategories.description">
          Gestisci le categorie del catalogo. Una categoria che contiene prodotti non può essere eliminata.
        </p>
      </div>
      <button matButton="filled" type="button" data-testid="category-new" (click)="openForm()">
        <mat-icon>add</mat-icon>
        <span i18n="@@adminCategories.new">Nuova categoria</span>
      </button>
    </div>

    @if (error(); as error) {
      <div appErrorPanel role="alert">{{ error.message }}</div>
    }

    <div class="overflow-x-auto rounded-xl border border-gray-200 bg-white">
      <table class="min-w-full text-left text-sm" data-testid="categories-table">
        <caption class="sr-only" i18n="@@adminCategories.caption">Elenco delle categorie</caption>
        <thead class="bg-gray-50 text-gray-700">
          <tr>
            <th scope="col" class="px-4 py-3 font-semibold" i18n="@@adminCategories.col.name">Nome</th>
            <th scope="col" class="px-4 py-3 font-semibold" i18n="@@adminCategories.col.description">Descrizione</th>
            <th scope="col" class="px-4 py-3 font-semibold text-right" i18n="@@adminCategories.col.products">Prodotti</th>
            <th scope="col" class="px-4 py-3 font-semibold text-right" i18n="@@adminCategories.col.actions">Azioni</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-gray-200">
          @for (category of categories(); track category.id) {
            <tr [attr.data-category]="category.name">
              <th scope="row" class="px-4 py-3 font-medium">{{ category.name }}</th>
              <td class="px-4 py-3 text-gray-700">{{ category.description }}</td>
              <td class="px-4 py-3 text-right">{{ category.products_count ?? 0 }}</td>
              <td class="px-4 py-3 text-right whitespace-nowrap">
                <button
                  matIconButton
                  type="button"
                  [attr.aria-label]="editLabel(category)"
                  (click)="openForm(category)"
                >
                  <mat-icon>edit</mat-icon>
                </button>
                <!-- Con prodotti l'eliminazione non è possibile (409): il pulsante è disabilitato e spiega perché -->
                <span [matTooltip]="hasProducts(category) ? notEmptyHint : ''">
                  <button
                    matIconButton
                    type="button"
                    class="danger"
                    [disabled]="hasProducts(category)"
                    [attr.aria-label]="deleteLabel(category)"
                    [attr.aria-describedby]="hasProducts(category) ? 'category-delete-hint' : null"
                    (click)="confirmDelete(category)"
                  >
                    <mat-icon>delete</mat-icon>
                  </button>
                </span>
              </td>
            </tr>
          } @empty {
            @if (loaded()) {
              <tr>
                <td colspan="4" class="px-4 py-6 text-center text-gray-600" i18n="@@adminCategories.empty">
                  Nessuna categoria.
                </td>
              </tr>
            }
          }
        </tbody>
      </table>
    </div>
    <p id="category-delete-hint" class="sr-only">{{ notEmptyHint }}</p>
  `,
  styles: ``,
})
export default class CategoriesPage implements OnInit {
  private readonly service = inject(AdminCategoriesService);
  private readonly dialog = inject(MatDialog);

  readonly categories = this.service.categories;
  readonly loaded = this.service.loaded;
  readonly error = this.service.error;

  readonly notEmptyHint = $localize`:@@adminCategories.notEmpty:La categoria contiene prodotti: spostali o eliminali prima di eliminarla.`;

  ngOnInit() {
    this.service.loadCategories();
  }

  hasProducts(category: Category) {
    return (category.products_count ?? 0) > 0;
  }

  editLabel(category: Category) {
    return $localize`:@@adminCategories.edit:Modifica ${category.name}:categoryName:`;
  }

  deleteLabel(category: Category) {
    return $localize`:@@adminCategories.delete:Elimina ${category.name}:categoryName:`;
  }

  openForm(category?: Category) {
    this.dialog.open(CategoryFormDialog, { data: category ?? null });
  }

  confirmDelete(category: Category) {
    const data: ConfirmDialogData = {
      title: $localize`:@@adminCategories.delete.title:Eliminare la categoria?`,
      message: $localize`:@@adminCategories.delete.message:La categoria "${category.name}:categoryName:" verrà eliminata definitivamente.`,
      confirmLabel: $localize`:@@delete:Elimina`,
    };
    this.dialog
      .open(ConfirmDialog, { data })
      .afterClosed()
      .subscribe((confirmed) => {
        if (confirmed) this.service.delete(category);
      });
  }
}
