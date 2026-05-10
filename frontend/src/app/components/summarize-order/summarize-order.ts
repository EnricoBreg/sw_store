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

      <div class="space-y-1 text-lg border-b pb-4">
        <div class="flex justify-between pt-2 font-bold text-xl">
          <span>Totale</span>
          <span>{{ total() | currency: "EUR" }}</span>
        </div>
        <div class="flex justify-between text-sm text-gray-600">
          <span>Di cui IVA (22%)</span>
          <span>{{ tax() | currency: "EUR" }}</span>
        </div>
      </div>

      <ng-content select="[actionButtons]" />
    </div>
  `,
  styles: ``,
})
export default class SummarizeOrder {
  readonly cartService = inject(CartService);

  private readonly cart = this.cartService.cart();

  total = computed(() => {
    if (!this.cart) return 0.0;
    return this.cart.items.reduce(
      (acc, item) => acc + item.quantity * item.unit_price * (1 - item.product.discount_percentage / 100.0),
      0.0,
    );
  });

  tax = computed(() => {
    const subtotal = this.total() / 1.22;
    return this.total() - subtotal;
  });
}
