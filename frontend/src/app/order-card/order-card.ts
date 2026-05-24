import { Component, input } from "@angular/core";
import { Order } from "../core/models/order";
import OrderStatusBadge from "../order-status-badge/order-status-badge";
import ISODateDisplayer from "../data-displayer/data-displayer";
import { MatAnchor } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: "app-order-card",
  imports: [OrderStatusBadge, ISODateDisplayer, RouterLink, MatIcon, MatAnchor],
  template: `
    <div
      class="border border-gray-400 rounded-lg p-4 cursor-pointer hover:bg-gray-100 hover:shadow-lg transition duration-200"
    >
      <h3 class="text-lg font-semibold mb-2">Ordine #{{ order().id }}</h3>
      
      <div class="my-1">
        <app-order-status-badge [status]="order().status" />
      </div>
      
      <p class="text-gray-700 mb-1">Nome: {{ order().first_name }} {{ order().last_name }}</p>
      <p class="text-gray-700 mb-1">
        Indirizzo: {{ order().street }}, {{ order().city }}, {{ order().zip_code }}
      </p>

      <p>
        Effettuato <app-isodate-displayer [date]="order().created_at" [relative]="true"/>
      </p>

      <p class="mt-2 font-semibold text-lg">Totale: €{{ order().total_amount }}</p>

      <div class="flex items-center gap-2">
        <button matButton="text" [routerLink]="[order().id]">
          <mat-icon>visibility</mat-icon>
          Dettagli
        </button>
      </div>
    </div>
  `,
  styles: ``,
})
export default class OrderCard {
  order = input.required<Order>();
}
