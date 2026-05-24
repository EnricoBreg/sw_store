import { NgClass } from "@angular/common";
import { Component, input } from "@angular/core";
import { Badge } from "../core/directives/badge";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

@Component({
  selector: "app-order-status-badge",
  imports: [NgClass, Badge],
  template: `
    @let s = status();

    <span
      appBadge
      [ngClass]="{
        'text-amber-700 bg-amber-50 ring-amber-600/20': s === 'pending',
        'text-blue-700 bg-blue-50 ring-blue-600/20': s === 'paid',
        'text-indigo-700 bg-indigo-50 ring-indigo-600/20': s === 'shipped',
        'text-green-700 bg-green-50 ring-green-600/20': s === 'delivered',
        'text-slate-600 bg-slate-100 ring-slate-500/20': s === 'cancelled',
        'text-red-700 bg-red-50 ring-red-600/20': s === 'refunded',
      }"
    >
      @switch (s) {
        @case ("pending") {
          In attesa di conferma
        }
        @case ("paid") {
          Pagato
        }
        @case ("shipped") {
          Spedito
        }
        @case ("delivered") {
          Consegnato
        }
        @case ("cancelled") {
          Annullato
        }
        @case ("refunded") {
          Rimborsato
        }
        @default {
          Sconosciuto
        }
      }
    </span>
  `,
  styles: ``,
})
export default class OrderStatusBadge {
  status = input.required<OrderStatus>();
}
