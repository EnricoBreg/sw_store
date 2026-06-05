import { Component } from "@angular/core";

@Component({
  selector: "app-no-product-found",
  imports: [],
  template: `
    <div class="flex flex-col items-center justify-center gap-2">
      <img src="/assets/no_product.png" alt="No Product Found" class="w-72 h-72 object-contain" />
      <ng-content select="[message]"></ng-content>
    </div>
  `,
  styles: ``,
})
export default class NoProductFound {}
