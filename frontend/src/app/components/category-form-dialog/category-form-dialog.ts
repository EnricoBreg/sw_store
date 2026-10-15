import { Component, inject, signal } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";
import { MatInput } from "@angular/material/input";
import { MatError, MatFormField, MatLabel } from "@angular/material/form-field";
import Category from "../../core/models/category";
import { AdminCategoriesService } from "../../core/services/admin-categories.service";
import { getApiError } from "../../core/http/api-error";

/** Dialog per creare (senza dati) o modificare (con `category`) una categoria. */
@Component({
  selector: "app-category-form-dialog",
  imports: [MatDialogModule, MatButton, MatInput, MatFormField, MatLabel, MatError, ReactiveFormsModule],
  template: `
    <h2 mat-dialog-title>
      @if (category) {
        <ng-container i18n="@@categoryForm.editTitle">Modifica categoria</ng-container>
      } @else {
        <ng-container i18n="@@categoryForm.newTitle">Nuova categoria</ng-container>
      }
    </h2>
    <form [formGroup]="form" (ngSubmit)="save()">
      <mat-dialog-content class="min-w-[min(420px,80vw)]">
        @if (error(); as error) {
          <div role="alert" data-testid="category-form-error" class="mb-4 rounded-lg bg-red-100 p-3 text-red-700">
            <p class="font-semibold">{{ error.message }}</p>
            @for (e of error.errors; track $index) {
              <p>{{ e }}</p>
            }
          </div>
        }
        <mat-form-field class="w-full">
          <mat-label i18n="@@categoryForm.name">Nome</mat-label>
          <input matInput formControlName="name" data-testid="category-name" />
          <mat-error i18n="@@categoryForm.name.required">Il nome è obbligatorio.</mat-error>
        </mat-form-field>
        <mat-form-field class="w-full">
          <mat-label i18n="@@categoryForm.description">Descrizione</mat-label>
          <textarea matInput formControlName="description" data-testid="category-description"></textarea>
        </mat-form-field>
      </mat-dialog-content>
      <mat-dialog-actions align="end">
        <button matButton type="button" mat-dialog-close i18n="@@confirmDialog.cancel">Annulla</button>
        <button matButton="filled" type="submit" data-testid="category-save" [disabled]="form.invalid || saving()">
          <ng-container i18n="@@categoryForm.save">Salva</ng-container>
        </button>
      </mat-dialog-actions>
    </form>
  `,
  styles: ``,
})
export default class CategoryFormDialog {
  readonly category = inject<Category | null>(MAT_DIALOG_DATA, { optional: true });

  private readonly service = inject(AdminCategoriesService);
  private readonly dialogRef = inject(MatDialogRef<CategoryFormDialog>);

  readonly saving = signal(false);
  readonly error = signal<{ message: string; errors: string[] } | null>(null);

  readonly form = inject(NonNullableFormBuilder).group({
    name: [this.category?.name ?? "", [Validators.required]],
    description: [this.category?.description ?? ""],
  });

  save() {
    if (this.form.invalid || this.saving()) return;

    const { name, description } = this.form.getRawValue();
    this.saving.set(true);
    this.error.set(null);

    this.service.save({ name: name.trim(), description: description.trim() || null }, this.category?.id).subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving.set(false);
        this.error.set(getApiError(err, $localize`:@@categoryForm.error:Impossibile salvare la categoria.`));
      },
    });
  }
}
