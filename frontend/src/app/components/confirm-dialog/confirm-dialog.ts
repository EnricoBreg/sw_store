import { Component, inject } from "@angular/core";
import { MAT_DIALOG_DATA, MatDialogModule } from "@angular/material/dialog";
import { MatButton } from "@angular/material/button";

export interface ConfirmDialogData {
  title: string;
  message: string;
  confirmLabel: string;
  /** Avviso aggiuntivo mostrato in evidenza (es. categoria che contiene prodotti). */
  warning?: string;
}

/** Dialog di conferma generico: si chiude con `true` se l'utente conferma. */
@Component({
  selector: "app-confirm-dialog",
  imports: [MatDialogModule, MatButton],
  template: `
    <h2 mat-dialog-title>{{ data.title }}</h2>
    <mat-dialog-content>
      <p>{{ data.message }}</p>
      @if (data.warning) {
        <p role="alert" class="mt-3 text-red-700 font-medium">{{ data.warning }}</p>
      }
    </mat-dialog-content>
    <mat-dialog-actions align="end">
      <button matButton type="button" [mat-dialog-close]="false" i18n="@@confirmDialog.cancel">Annulla</button>
      <button matButton="filled" type="button" class="danger" [mat-dialog-close]="true" cdkFocusInitial>
        {{ data.confirmLabel }}
      </button>
    </mat-dialog-actions>
  `,
  styles: ``,
})
export default class ConfirmDialog {
  readonly data = inject<ConfirmDialogData>(MAT_DIALOG_DATA);
}
