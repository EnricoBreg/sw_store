import { Component, input } from "@angular/core";
import { Order } from "../core/models/order";
import OrderStatusBadge from "../order-status-badge/order-status-badge";
import ISODateDisplayer from "../data-displayer/data-displayer";
import { CurrencyPipe } from "@angular/common";

@Component({
  selector: "app-order-card",
  imports: [OrderStatusBadge, ISODateDisplayer, CurrencyPipe],
  template: `
    <div
      class="border border-gray-400 rounded-lg p-4 cursor-pointer hover:bg-gray-100 hover:shadow-lg transition duration-200"
    >
      <h3 i18n="@@orderCard.orderId" class="text-lg font-semibold mb-2">
        Ordine #{{
          order().id //i18n(ph="orderId")
        }}
      </h3>

      <div class="my-1">
        <app-order-status-badge [status]="order().status" />
      </div>

      <p i18n="@@orderCard.customerName" class="text-gray-700 mb-1">
        Nome:
        {{
          order().first_name //i18n(ph="orderFirstName")
        }}
        {{
          order().last_name //i18n(ph="orderLastName")
        }}
      </p>
      <p i18n="@@orderCard.customerAddress" class="text-gray-700 mb-1">
        Indirizzo:
        {{
          order().street  //i18n(ph="orderStreet")
        }},
        {{
          order().city  //i18n(ph="orderCity")
        }},
        {{
          order().zip_code //i18n(ph="orderZipCode")
        }}
      </p>

      <p i18n="@@orderCard.orderDate" class="text-gray-600">
        Effettuato <app-isodate-displayer [date]="order().created_at" [relative]="true" />
      </p>

      <p i18n="@@orderCard.orderTotal" class="mt-2 font-semibold text-lg">
        Totale:
        {{
          order().total_amount | currency: "EUR" ////i18n(ph="orderTotalAmount")
        }}
      </p>
    </div>
  `,
  styles: ``,
})
export default class OrderCard {
  order = input.required<Order>();
}
