import { Component, inject, input, OnInit } from "@angular/core";
import { AdminOrdersService } from "../../../../core/services/admin-orders.service";
import { CurrencyPipe, JsonPipe } from "@angular/common";
import { BackButton } from "../../../../components/back-button/back-button";
import { ErrorPanel } from "../../../../core/directives/error-panel";
import ISODateDisplayer from "../../../../data-displayer/data-displayer";
import { InnerPanel } from "../../../../core/directives/inner-panel";
import OrderStatusBadge from "../../../../order-status-badge/order-status-badge";
import { MatAnchor } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { computeVat, handleImageError } from "../../../../core/utils";

@Component({
  selector: "app-order-detail-page",
  imports: [BackButton, ErrorPanel, ISODateDisplayer, InnerPanel, OrderStatusBadge, MatAnchor, MatIcon, CurrencyPipe],
  template: `
    <div>
      <app-back-button class="mb-10"> Torna alla lista degli ordini </app-back-button>

      <div class="mb-6">
        <h1 class="mb-2 text-2xl font-bold">Dettaglio ordine</h1>
        <p>
          Questa è la pagina dei dettagli dell'ordine. Qui puoi visualizzare tutte le informazioni
          relative all'ordine selezionato, inclusi i prodotti ordinati, lo stato dell'ordine e i
          dettagli di spedizione.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        @if (order(); as order) {

          <div appInnerPanel>
            <h3 class="mb-1 text-lg font-semibold">Informazioni ordine</h3>
            <p>Identificativo: {{ order.id }}</p>
            <p>Utente: {{ order.user.full_name }}</p>
            <p>Data: <app-isodate-displayer [date]="order.created_at" /></p>
          </div>

          <div appInnerPanel>
            <h3 class="mb-1 text-lg font-semibold">Stato ordine</h3>
            <div class="mb-4">
              <app-order-status-badge [status]="order.status"></app-order-status-badge>
            </div>
            <button matButton="outlined">
              <mat-icon>edit</mat-icon>
              Modifica stato
            </button>
          </div>

          <div appInnerPanel>
            <h3 class="mb-1 text-lg font-semibold">Spedizione</h3>
            <p>{{ order.first_name }} {{ order.last_name }}</p>
            <p>{{ order.street }}</p>
            <p>{{ order.city }}, {{ order.zip_code }}</p>
            <p>{{ order.country }}</p>
          </div>

          <div appInnerPanel>
            <h3 class="mb-1 text-lg font-semibold">Riepilogo</h3>
            <p>Prodotti ordinati: {{ order.items.length }}</p>
            <p class="font-medium text-lg">Totale: {{ order.total_amount | currency: "EUR" }}</p>
            <p>Di cui IVA (22%): {{ computeVat(order.total_amount) | currency: "EUR" }}</p>
          </div>

          <div appInnerPanel class="md:col-span-2">
            <h3 class="mb-1 text-lg font-semibold">Prodotti ordinati</h3>
            <div class="flex flex-col gap-4">
              @for (item of order.items; track item.product.id) {
                <div class="flex flex-col md:flex-row gap-4 items-center">
                  <img
                    [src]="item.product.image_url"
                    [alt]="item.product.name"
                    class="h-24 w-24 object-cover rounded-lg"
                    (error)="handleImageError($event)"
                  />
                  <div class="flex flex-col flex-1">
                    <p class="block font-semibold">{{ item.product.name }}</p>
                    <div appInnerPanel class="w-full px-6 py-2 text-gray-700 bg-gray-100 rounded-lg flex flex-col gap-1 md:flex-row md:items-center md:justify-between">
                      <p>Quantità: {{ item.quantity }}</p>
                      <p>Prezzo unitario: {{ item.unit_price | currency: "EUR" }}</p>
                      <p>Totale: {{ item.total_price | currency: "EUR" }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>

        } @else {
          <div>
            <p class="text-red-500">Non è stato possibile caricare i dettagli dell'ordine.</p>
            <p appErrorPanel>{{ error()?.join(", ") }}</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: ``,
})
export default class OrderDetailPage implements OnInit {
  orderId = input.required<number>();

  private readonly service = inject(AdminOrdersService);

  readonly order = this.service.order;
  readonly error = this.service.error;

  readonly computeVat = computeVat;
  readonly handleImageError = handleImageError;

  ngOnInit() {
    this.service.getById(this.orderId());
  }
}
