import { Component, inject, signal } from "@angular/core";
import { NonNullableFormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog";
import { MatIcon } from "@angular/material/icon";
import { MatFormField, MatLabel, MatOption, MatSelect } from "@angular/material/select";
import { ORDER_STATUS_LABELS, ORDER_STATUS_TRANSITIONS, OrderStatus } from "../../core/models/order";
import { getApiError } from "../../core/http/api-error";
import OrderStatusBadge from "../../order-status-badge/order-status-badge";
import { MatButton, MatIconButton } from "@angular/material/button";
import Accordion from "../accordion/accordion";
import ExpandableContent from "../expandable-content/expandable-content";
import { AdminOrdersService } from "../../core/services/admin-orders.service";
import { tap } from "rxjs";
import { LoadingService } from "../../core/http/services/loading.service";

@Component({
  selector: "app-change-order-status-dialog",
  imports: [
    MatDialogModule,
    MatIcon,
    MatIconButton,
    MatFormField,
    ReactiveFormsModule,
    MatLabel,
    MatSelect,
    MatOption,
    OrderStatusBadge,
    MatButton,
    Accordion,
    ExpandableContent,
  ],
  template: `
    <div class="p-8 max-w-[400px] flex flex-col">
      <div class="flex justify-between mb-3">
        <div>
          <h2 class="text-xl font-medium mb-1" i18n="@@changeOrderStatus.title">
            Aggiorna lo stato dell'ordine: {{ data.orderCode }}
          </h2>
        </div>
        <button
          tabindex="-1"
          matIconButton
          class="-mt-2 -mr-2"
          mat-dialog-close
          i18n-aria-label="@@dialog.close"
          aria-label="Chiudi"
        >
          <mat-icon>close</mat-icon>
        </button>
      </div>

      @if (statusOptions.length > 0) {
      <app-accordion>
        <app-expandable-content>
          <ng-container title>
            <div class="flex items-center gap-1">
              <img src="assets/warning_icon.svg" alt="" class="inline w-6 h-6" />
              <span class="text-yellow-700 font-semibold" i18n="@@changeOrderStatus.warning">Attenzione!</span>
            </div>
          </ng-container>
          <ng-container content>
            <p class="text-sm text-gray-500" i18n="@@changeOrderStatus.warning.description">
              Il cambio dello stato dell'ordine è un'azione importante che può influire sulla
              gestione dell'inventario, sulle notifiche al cliente e sui processi di spedizione.
              <span class="font-semibold"
                >Assicurati di selezionare lo stato corretto in base alla situazione attuale
                dell'ordine.</span
              >
            </p>
            <p class="text-sm text-gray-500" i18n="@@changeOrderStatus.warning.notifications">
              Al cambio dello stato dell'ordine, potrebbero essere inviate notifiche al cliente e
              aggiornamenti al sistema di gestione dell'inventario. Assicurati di comunicare
              eventuali cambiamenti significativi al cliente, soprattutto se lo stato dell'ordine
              passa a "spedito", "consegnato" o "cancellato".
            </p>
          </ng-container>
        </app-expandable-content>
      </app-accordion>

      <p class="mt-3" i18n="@@changeOrderStatus.effect">La modifica avrà il seguente effetto:</p>
      <div class="my-3 flex items-center justify-between">
        <app-order-status-badge [status]="data.initialStatus"></app-order-status-badge>
        <mat-icon>arrow_forward</mat-icon>
        @if (changeOrderStatusForm.controls.status.value; as nextStatus) {
          <app-order-status-badge [status]="nextStatus"></app-order-status-badge>
        } @else {
          <span class="text-gray-600" aria-hidden="true">—</span>
        }
      </div>

      }

      @if (error(); as error) {
        <div role="alert" data-testid="order-status-error" class="mt-3 rounded-lg bg-red-100 p-3 text-red-700">
          <p class="font-semibold">{{ error.message }}</p>
          @for (e of error.errors; track $index) {
            <p>{{ e }}</p>
          }
        </div>
      }

      @if (statusOptions.length === 0) {
        <p class="mt-6 text-gray-700" role="status" i18n="@@changeOrderStatus.finalState">
          L'ordine è in uno stato finale: non sono possibili altre modifiche.
        </p>
      } @else {
      <form class="mt-6" [formGroup]="changeOrderStatusForm" (ngSubmit)="submitChangeOrderStatus()">
        <mat-form-field>
          <mat-label i18n="@@changeOrderStatus.newStatus">Nuovo stato</mat-label>
          <mat-select formControlName="status">
            @for (option of statusOptions; track option.key) {
              <mat-option [value]="option.key">
                <app-order-status-badge [status]="option.key"></app-order-status-badge>
              </mat-option>
            }
          </mat-select>
        </mat-form-field>

        <button type="submit" matButton="filled" class="w-full" [disabled]="disableButton()" i18n="@@changeOrderStatus.submit">
          Aggiorna stato
        </button>
      </form>
      }
    </div>
  `,
  styles: ``,
})
export default class ChangeOrderStatusDialog {
  private readonly service = inject(AdminOrdersService);
  private readonly loadingService = inject(LoadingService);

  fb = inject(NonNullableFormBuilder);
  changeOrderStatusForm = this.fb.group({
    status: [null as OrderStatus | null, Validators.required],
  });

  dialogRef = inject(MatDialogRef);

  data = inject<{ orderId: number; orderCode: string, initialStatus: OrderStatus }>(MAT_DIALOG_DATA);

  protected readonly orderStatusLabels = ORDER_STATUS_LABELS;
  // Solo le transizioni ammesse dallo stato attuale
  protected readonly statusOptions = (ORDER_STATUS_TRANSITIONS[this.data.initialStatus] ?? []).map((key) => ({
    key,
    label: ORDER_STATUS_LABELS[key],
  }));

  readonly error = signal<{ message: string; errors: string[] } | null>(null);

  disableButton() {
    const selectedStatus = this.changeOrderStatusForm.value.status;
    return (
      this.changeOrderStatusForm.invalid ||
      selectedStatus === this.data.initialStatus ||
      this.loadingService.isLoading()
    );
  }

  submitChangeOrderStatus() {
    this.service
      .updateOrderStatus(this.data.orderId, this.changeOrderStatusForm.value.status!)
      .subscribe({
        next: () => {
          this.dialogRef.close();
        },
        // Il 422 del backend (transizione non consentita) resta visibile nel dialog
        error: (err) => {
          this.error.set(
            getApiError(
              err,
              $localize`:@@adminOrdersService.updateStatusError:Errore nell'aggiornamento dello stato dell'ordine.`,
            ),
          );
        },
      });
  }
}
