import { Component, computed, inject, input, OnInit } from "@angular/core";
import { CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { MatAnchor } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { ErrorPanel } from "../../core/directives/error-panel";
import { OrdersService } from "../../core/services/orders.service";
import OrderStatusBadge from "../../order-status-badge/order-status-badge";

/** Conferma dopo il checkout: rilegge l'ordine dal server, quindi funziona anche dopo un reload. */
@Component({
  selector: "app-order-confirmation-page",
  imports: [CurrencyPipe, RouterLink, MatAnchor, MatIcon, ViewPanel, ErrorPanel, OrderStatusBadge],
  template: `
    <div class="mx-auto max-w-[800px] py-6">
      @if (error(); as error) {
        <div appErrorPanel role="alert">{{ error.message }}</div>
      }

      @if (order(); as order) {
        <section appViewPanel data-testid="order-confirmation" class="flex flex-col items-center text-center gap-3">
          <mat-icon class="!w-16 !h-16 !text-[64px] !text-green-700" aria-hidden="true">check_circle</mat-icon>
          <h1 class="text-2xl font-bold" i18n="@@orderConfirmation.title">Grazie! Il tuo ordine è stato registrato.</h1>

          <p class="text-gray-700" i18n="@@orderConfirmation.code">
            Codice ordine: <strong data-testid="order-code">{{ order.code }}</strong>
          </p>
          <app-order-status-badge [status]="order.status" />

          <dl class="mt-2 grid grid-cols-2 gap-x-6 gap-y-1 text-left">
            <dt class="text-gray-600" i18n="@@orderConfirmation.items">Articoli</dt>
            <dd class="font-medium">{{ itemsCount() }}</dd>
            <dt class="text-gray-600" i18n="@@orderConfirmation.total">Totale</dt>
            <dd class="font-semibold" data-testid="order-total">{{ order.total_amount | currency: "EUR" }}</dd>
            <dt class="text-gray-600" i18n="@@orderConfirmation.shipping">Spedizione a</dt>
            <dd>{{ order.first_name }} {{ order.last_name }}, {{ order.street }}, {{ order.zip_code }} {{ order.city }}</dd>
          </dl>

          <div class="mt-4 flex flex-wrap justify-center gap-3">
            <a matButton="filled" [routerLink]="['/my-orders', order.id]" i18n="@@orderConfirmation.detail">
              Vedi il dettaglio dell'ordine
            </a>
            <a matButton="outlined" routerLink="/my-orders" i18n="@@orderConfirmation.myOrders">I miei ordini</a>
            <a matButton routerLink="/products" i18n="@@orderConfirmation.continue">Continua lo shopping</a>
          </div>
        </section>
      } @else if (!error()) {
        <p role="status" class="text-gray-600" i18n="@@orderConfirmation.loading">Caricamento dell'ordine...</p>
      }
    </div>
  `,
  styles: ``,
})
export default class OrderConfirmationPage implements OnInit {
  orderId = input.required<string>();

  private readonly ordersService = inject(OrdersService);

  order = this.ordersService.order;
  error = this.ordersService.orderError;
  itemsCount = computed(() => this.order()?.items.reduce((sum, item) => sum + item.quantity, 0) ?? 0);

  ngOnInit() {
    // L'ordine appena creato è già in memoria: si rilegge solo se manca (es. dopo un reload)
    if (String(this.order()?.id) !== this.orderId()) {
      this.ordersService.loadOrderById(this.orderId());
    }
  }
}
