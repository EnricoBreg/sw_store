import { CurrencyPipe } from "@angular/common";
import { Component, computed, input } from "@angular/core";
import Product from "../../core/models/product";

@Component({
  selector: "app-product-price",
  imports: [CurrencyPipe],
  template: `
    <div class="flex items-center gap-2">
      <p [class]="mainPriceClasses()"
      >
        {{ discountPrice() | currency: "EUR" }}
      </p>
      @if (product().discount_percentage > 0) {
        <p class="text-xs text-gray-600 line-through">
          {{ product().price | currency: "EUR" }}
        </p>
        <span class="text-xs bg-red-100 text-red-500 font-medium px-2 py-1 rounded ml-2">
          -{{ discountPercentageInt() }}%
        </span>
      }
    </div>
  `,
  styles: ``,
})
export default class ProductPrice {
  product = input.required<Product>();
  className = input<string>("text-lg");

  discountPrice = computed(
    () => this.product().price * (1 - this.product().discount_percentage / 100.0),
  );

  discountPercentageInt = computed(() => Math.round(this.product().discount_percentage));

  mainPriceClasses = computed(() => {
    const color = this.product().discount_percentage > 0 ? "text-red-500" : "text-black";
    const base = "self-start font-semibold cursor-auto my-3";

    return `${base} ${color} ${this.className()}`;
  })
}
