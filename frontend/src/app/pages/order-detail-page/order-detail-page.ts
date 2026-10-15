import { Component, computed, inject, input, OnInit } from "@angular/core";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { OrdersService } from "../../core/services/orders.service";
import OrderStatusBadge from "../../order-status-badge/order-status-badge";
import { MatIcon } from "@angular/material/icon";
import ISODateDisplayer from "../../data-displayer/data-displayer";
import { MatStepperModule } from "@angular/material/stepper";
import { computeVat, handleImageError } from "../../core/utils";
import { CurrencyPipe } from "@angular/common";
import { InnerPanel } from "../../core/directives/inner-panel";
import { BackButton } from "../../components/back-button/back-button";

@Component({
  selector: "app-order-detail-page",
  imports: [
    ViewPanel,
    OrderStatusBadge,
    MatIcon,
    ISODateDisplayer,
    MatStepperModule,
    CurrencyPipe,
    InnerPanel,
    BackButton,
  ],
  template: `
    <div class="mx-auto max-w-[1200px] py-6">
      <app-back-button class="mb-4">
        <ng-container i18n="@@tornaAiMieiOrdini">
          Torna ai miei ordini
        </ng-container>
      </app-back-button>

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
          <h1 i18n="@@orderDetail.title" class="text-2xl font-extrabold mb-4">
            Dettagli ordine #{{ orderId() //i18n(ph="orderDetail.orderId") }}
          </h1>

          <div class="text-sm text-gray-500 mt-2 flex items-center gap-2">
            <mat-icon>calendar_today</mat-icon>
            <span i18n="@@orderDetail.effettuato">Effettuato</span>
            <app-isodate-displayer [date]="order.created_at" [relative]="true" />
            (<app-isodate-displayer [date]="order.created_at" [relative]="false" />)
          </div>

          <div class="mt-2">
            <app-order-status-badge [status]="order.status" class="scale-105" />
          </div>

          <div appInnerPanel>
            <mat-stepper
              [selectedIndex]="currentStepIndex()"
              [linear]="true"
              [labelPosition]="'bottom'"
              class="!bg-transparent"
            >
              <mat-step
                i18n-label="@@orderDetail.stepper.inAttesa.label"
                label="In attesa"
                [state]="order.status === 'cancelled' ? 'cancel' : 'number'"
                [editable]="false"
                [completed]="false"
              >
                <p i18n="@@orderDetail.stepper.inAttesa.description" class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Ordine registrato nei nostri sistemi.
                </p>
              </mat-step>

              <mat-step i18n-label="@@orderDetail.stepper.pagato.label" label="Pagato" [editable]="false" [completed]="false">
                <p i18n="@@orderDetail.stepper.pagato.description" class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Pagamento confermato. Ordine in preparazione.
                </p>
              </mat-step>

              <mat-step i18n-label="@@orderDetail.stepper.spedito.label" label="Spedito" [editable]="false" [completed]="false">
                <p i18n="@@orderDetail.stepper.spedito.description" class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Affidato al corriere espresso.
                </p>
              </mat-step>

              <mat-step i18n-label="@@orderDetail.stepper.consegnato.label" label="Consegnato" [editable]="false" [completed]="false">
                <p i18n="@@orderDetail.stepper.consegnato.description" class="text-center text-gray-500 mt-2 max-w-xs mx-auto">
                  Consegnato all'indirizzo specificato. Grazie per aver acquistato da noi!
                </p>
              </mat-step>

              @if (order.status === "cancelled") {
                <ng-template matStepperIcon="cancel">
                  <mat-icon color="warn">cancel</mat-icon>
                </ng-template>
              }
            </mat-stepper>
          </div>

          <div appInnerPanel>
            <h3 i18n="@@orderDetail.shipping.title" class="text-xl font-bold mb-4">Dettagli di spedizione</h3>
            <p i18n="@@orderDetails.shipping.name" class="text-gray-700 mb-1">Nome: {{ order.first_name }} {{ order.last_name }}</p>
            <p i18n="@@orderDetails.shipping.address" class="text-gray-700 mb-1">Indirizzo: {{ order.street }}</p>
            <p i18n="@@orderDetails.shipping.city" class="text-gray-700 mb-1">Città: {{ order.city }}, {{ order.zip_code }}</p>
            <p i18n="@@orderDetails.shipping.country" class="text-gray-700 mb-1">Stato: {{ order.country }}</p>
          </div>

          <div appInnerPanel>
            <h3 i18n="@@orderDetail.items.title" class="text-xl font-semibold">Gli articoli del tuo ordine</h3>
            @for (item of order.items; track item.id) {
              <div class="flex items-center justify-between py-4 px-6 border-b border-gray-200">
                <div class="flex items-center gap-2">
                  <img
                    [src]="item.product.image_url"
                    [alt]="item.product.name"
                    class="w-16 h-16 object-cover rounded mr-4"
                    (error)="handleImageError($event)"
                  />
                  <p class="md:text-lg font-medium">
                    {{ item.quantity }} x {{ item.product.name }}
                  </p>
                </div>

                <p class="text-lg font-semibold">
                  {{ item.unit_price * item.quantity | currency: "EUR" }}
                </p>
              </div>
            }
            <div class="flex flex-col items-end justify-end mt-6 px-6">
              <p i18n="@@orderDetail.total" class="text-2xl font-bold">Totale: {{ order.total_amount | currency: "EUR" }}</p>
              <p i18n="@@orderDetail.vat" class="text-sm text-gray-500">
                di cui IVA (22%): {{ computeVat(order.total_amount) | currency: "EUR" }}
              </p>
            </div>
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

  readonly handleImageError = handleImageError;
  readonly computeVat = computeVat;

  ngOnInit() {
    this.ordersService.loadOrderById(this.orderId());
  }
}
