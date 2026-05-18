import { Component, input } from "@angular/core";
import { NgClass } from "@angular/common";
import { Badge } from "../../core/directives/badge";

@Component({
  selector: "app-stock-badge",
  imports: [NgClass, Badge],
  template: `
    @let sq = stock_quantity();

    <span
      appBadge
      [ngClass]="{
        'text-red-700 bg-red-100 ring-red-600/20': sq === 0,
        'text-green-700 bg-green-50 ring-green-600/20':
          sq !== undefined && sq > 5,
        'text-yellow-700 bg-yellow-100 ring-yellow-600/20': sq !== undefined && sq >= 1 && sq <= 5,
        'text-gray-400': sq === undefined,
      }"
    >
      @if (sq > 0) {
        {{ sq }} pezzi
      } @else if (sq === 0) {
        Esaurito
      } @else {
        N/A
      }
    </span>
  `,
  styles: ``,
})
export default class StockBadge {
  stock_quantity = input.required<number>();
}
