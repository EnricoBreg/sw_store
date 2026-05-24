import { Component, computed, inject, input, OnInit } from "@angular/core";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { OrdersService } from "../../core/services/orders.service";
import OrderStatusBadge from "../../order-status-badge/order-status-badge";
import { MatIcon } from "@angular/material/icon";
import ISODateDisplayer from "../../data-displayer/data-displayer";
import { MatStepperModule } from "@angular/material/stepper";

@Component({
  selector: "app-order-detail-page",
  imports: [ViewPanel, OrderStatusBadge, MatIcon, ISODateDisplayer, MatStepperModule],
  template: `
    <div class="mx-auto max-w-[1200px] py-6">
      @if (error(); as error) {
        <div appErrorPanel>
          <h4 class="text-lg font-semibold text-red-700 mb-3">{{ error.message }}</h4>
          <div class="space-y-2">
            @for (err of error.errors; track $index) {
              <p class="ml-2">{{ err }}</p>
            }
          </div>
        </div>
      }

      @if (order(); as order) {
        <div appViewPanel>
          <h1 class="text-2xl font-extrabold mb-4">Dettagli ordine #{{ orderId() }}</h1>
          <div class="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <mat-icon>calendar_today</mat-icon>
            <span>Effettuato</span>
            <app-isodate-displayer [date]="order.created_at" [relative]="true" />
            (<app-isodate-displayer [date]="order.created_at" [relative]="false" />)
          </div>

          <div class="mt-2">
            <app-order-status-badge [status]="order.status" class="scale-105" />
          </div>

          <div class="rounded-2xl border border-gray-200/70 shadow-xs p-6 mb-8 overflow-x-auto">
            <mat-stepper
              [selectedIndex]="currentStepIndex()"
              [linear]="true"
              [labelPosition]="'bottom'"
              class="!bg-transparent"
            >
              <mat-step
                label="In attesa"
                [state]="order.status === 'cancelled' ? 'cancel' : 'number'"
                [editable]="false"
                [completed]="false"
              >
                <p class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Ordine registrato nei nostri sistemi.
                </p>
              </mat-step>

              <mat-step label="Pagato" [editable]="false" [completed]="false">
                <p class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Pagamento confermato. Ordine in preparazione.
                </p>
              </mat-step>

              <mat-step label="Spedito" [editable]="false" [completed]="false">
                <p class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Affidato al corriere espresso.
                </p>
              </mat-step>

              <mat-step label="Consegnato" [editable]="false" [completed]="false">
                <p class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Consegnato all'indirizzo specificato. Grazie per aver acquistato da noi!
                </p>
              </mat-step>

              @if (order.status === "cancelled") {
                <ng-template matStepperIcon="cancel">
                  <mat-icon color="warn">cancel</mat-icon>
                </ng-template>
              }
            </mat-stepper>

            <!-- TODO: Dettagli ordine (indirizzo, totale, ecc) -->
          </div>
        </div>
      }
    </div>
  `,
  styles: `
    :host ::v-deep {
      .mat-horizontal-stepper-header-container {
        padding: 0;
      }

      .mat-step-header {
        cursor: default !important;
        pointer-events: none !important;
      }
    }
  `,
})
export default class OrderDetailPage implements OnInit {
  orderId = input.required<string>();

  private ordersService = inject(OrdersService);

  order = this.ordersService.order;
  error = this.ordersService.error;

  currentStepIndex = computed(() => {
    const status = this.order()?.status;
    switch (status) {
      case "pending":
        return 0;
      case "paid":
        return 1;
      case "shipped":
        return 2;
      case "delivered":
        return 3;
      case "cancelled":
        return 0; // Rimaniamo al primo step, ma mostriamo l'icona di cancellazione
      default:
        return 0;
    }
  });

  ngOnInit() {
    this.ordersService.loadOrderById(this.orderId());
  }
}
