import { Component, input } from "@angular/core";
import { Badge } from "../../core/directives/badge";

@Component({
  selector: "app-discount-badge",
  imports: [Badge],
  template: `
    @let dp = discount_percentage();

    @if (dp > 0) {
      <span
        appBadge
        class="bg-green-50 text-green-700 ring-green-600/20"
      >
        -{{ dp }}%
      </span>
    } @else {
      <span class="text-gray-400">Nessuno sconto applicato</span>
    }
  `,
  styles: ``,
})
export default class DiscountBadge {
  discount_percentage = input.required<number>();
}
