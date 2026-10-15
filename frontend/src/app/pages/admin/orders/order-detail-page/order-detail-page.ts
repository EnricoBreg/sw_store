import { Component, inject, input, OnInit } from "@angular/core";
import { AdminOrdersService } from "../../../../core/services/admin-orders.service";
import { CurrencyPipe } from "@angular/common";
import { BackButton } from "../../../../components/back-button/back-button";
import { ErrorPanel } from "../../../../core/directives/error-panel";
import ISODateDisplayer from "../../../../data-displayer/data-displayer";
import { InnerPanel } from "../../../../core/directives/inner-panel";
import OrderStatusBadge from "../../../../order-status-badge/order-status-badge";
import { MatAnchor } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { computeVat, handleImageError } from "../../../../core/utils";
import { MatDialog, MatDialogRef } from "@angular/material/dialog";
import ChangeOrderStatusDialog from "../../../../components/change-order-status-dialog/change-order-status-dialog";
import DiscountBadge from "../../../../components/discount-badge/discount-badge";

@Component({
  selector: "app-order-detail-page",
  imports: [
    BackButton,
    ErrorPanel,
    ISODateDisplayer,
    InnerPanel,
    OrderStatusBadge,
    MatAnchor,
    MatIcon,
    CurrencyPipe,
    DiscountBadge,
  ],
  template: `
    <div>
      <app-back-button class="mb-10"><ng-container i18n="@@backToOrderList">Torna alla lista degli ordini</ng-container></app-back-button>

      <div class="mb-6">
        <h1 i18n="@@orderDetailPage.title" class="mb-2 text-2xl font-bold">Dettaglio ordine</h1>
        <p i18n="@@orderDetailPage.description">
          Questa è la pagina dei dettagli dell'ordine. Qui puoi visualizzare tutte le informazioni
          relative all'ordine selezionato, inclusi i prodotti ordinati, lo stato dell'ordine e i
          dettagli di spedizione.
        </p>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-2 gap-x-4">
        @if (order(); as order) {
          <div appInnerPanel>
            <h3 i18n="@@orderDetailPage.order.info" class="mb-1 text-lg font-semibold">Informazioni ordine</h3>
            <p i18n="@@orderDetailPage.order.code">
              Codice: <span class="font-medium">{{ order.code }}</span>
            </p>
            @if (order.user.full_name) {
              <p i18n="@@orderDetailPage.order.fullName">
                Nome utente: <span class="font-medium">{{ order.user.full_name }}</span>
              </p>
            }
            <p i18n="@@orderDetailPage.order.email">
              Email utente: <span class="font-medium">{{ order.user.email }}</span>
            </p>
            <p i18n="@@orderDetailPage.order.date">
              Data:
              <span class="font-medium">
                <app-isodate-displayer [date]="order.created_at" />
              </span>
            </p>
          </div>

          <div appInnerPanel>
            <h3 i18n="@@orderDetailPage.order.status" class="mb-1 text-lg font-semibold">Stato ordine</h3>
            <div class="mb-4">
              <app-order-status-badge [status]="order.status"></app-order-status-badge>
            </div>
            <button matButton="outlined" (click)="openChangeOrderStatusDialog()">
              <mat-icon>edit</mat-icon>
              <ng-container i18n="@@orderDetailPage.order.editStatus">Modifica stato</ng-container>
            </button>
          </div>

          <div appInnerPanel>
            <h3 i18n="@@orderDetailPage.order.shipping" class="mb-1 text-lg font-semibold">Spedizione</h3>
            <p class="font-medium">{{ order.first_name }} {{ order.last_name }}</p>
            <p class="font-medium">{{ order.street }}</p>
            <p class="font-medium">{{ order.city }}, {{ order.zip_code }}</p>
            <p class="font-medium">{{ order.country }}</p>
          </div>

          <div appInnerPanel>
            <h3 i18n="@@orderDetailPage.order.summary" class="mb-1 text-lg font-semibold">Riepilogo</h3>
            <p i18n="@@orderDetailPage.order.productsOrdered">
              Prodotti ordinati: <span class="font-medium">{{ order.items.length }}</span>
            </p>
            <p i18n="@@orderDetailPage.order.totalAmount" class="font-medium text-lg">Totale: {{ order.total_amount | currency: "EUR" }}</p>
            <p i18n="@@orderDetailPage.order.vat">
              Di cui IVA (22%):
              <span class="font-medium">{{
                computeVat(order.total_amount) | currency: "EUR"
              }}</span>
            </p>
          </div>

          <div appInnerPanel class="md:col-span-2">
            <h3 i18n="@@orderDetailPage.order.products" class="mb-1 text-lg font-semibold">Prodotti ordinati</h3>
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
                    <p i18n="@@orderDetailPage.order.productName" class="block font-semibold">{{ item.product.name }}</p>
                    <div
                      appInnerPanel
                      class="w-full px-6 py-2 text-gray-700 bg-gray-100 rounded-lg flex flex-col gap-1 md:flex-row md:items-center md:justify-between"
                    >
                      <p i18n="@@orderDetailPage.order.quantity">
                        Quantità: <span class="font-semibold">{{ item.quantity }}</span>
                      </p>
                      <p i18n="@@orderDetailPage.order.unitPrice">
                        Prezzo unitario:
                        <span class="font-semibold">{{ item.unit_price | currency: "EUR" }}</span>
                      </p>
                      <p i18n="@@orderDetailPage.order.discount">
                        Sconto:
                        <app-discount-badge
                          [discountPercentage]="item.discount_percentage"
                        ></app-discount-badge>
                      </p>
                      <p i18n="@@orderDetailPage.order.total">
                        Totale:
                        <span class="font-semibold">{{ item.total_price | currency: "EUR" }}</span>
                      </p>
                    </div>
                  </div>
                </div>
              }
            </div>
          </div>
        } @else {
          <div>
            <p i18n="@@orderDetailPage.error.loading" class="text-red-500">Non è stato possibile caricare i dettagli dell'ordine.</p>
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

  private readonly matDialogService = inject(MatDialog);

  readonly order = this.service.order;
  readonly error = this.service.error;

  readonly computeVat = computeVat;
  readonly handleImageError = handleImageError;

  ngOnInit() {
    this.service.getById(this.orderId());
  }

  openChangeOrderStatusDialog() {
    this.matDialogService.open(ChangeOrderStatusDialog, {
      disableClose: true,
      data: {
        orderId: this.orderId(),
        orderCode: this.order()?.code,
        initialStatus: this.order()?.status,
      },
    });
  }
}
