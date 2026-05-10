import { CurrencyPipe } from "@angular/common";
import { Component, computed, inject } from "@angular/core";
import { CartService } from "../../core/services/cart.service";
import ViewPanel from "../../core/directives/view-panel/view-panel";

@Component({
  selector: "app-summarize-order",
  imports: [CurrencyPipe, ViewPanel],
  template: `
    <div appViewPanel>
      <h2 class="text-2xl font-bold mb-4"></h2>

      <div class="space-y-2 mb-2">
        <ng-content select="[checkoutItems]" />
      </div>

      <div class="space-y-3 text-lg pt-4 border-t">
        <div class="flex justify-between">
          <span>Subtotale</span>
          <!-- <span>{{ subtotal() | currency: "EUR" }}</span> -->
        </div>

        <div class="flex justify-between border-t pt-2 font-bold text-lg">
          <span>Totale</span>
          <!-- <span>{{ total() | currency: "EUR" }}</span> -->
        </div>
      </div>

      <ng-content select="[actionButtons]" />
    </div>
  `,
  styles: ``,
})
export default class SummarizeOrder {
  readonly cartService = inject(CartService);

  subtotal = computed(() => {
    const subtotal = this.cartService
      .cart()!
      .items.reduce(
        (acc, item) => acc + item.unit_price * (1 - item.product.discount_percentage / 100.0),
        0.0,
      );

    console.log("Subtotal: ", subtotal);
    return this.cartService.cart()!.items.reduce((acc, item) => acc + (item.unit_price * (1 - item.product.discount_percentage / 100.0)), 0.0);
  });

  total = computed(() => this.subtotal());
}
