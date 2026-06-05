import { Component } from "@angular/core";
import { MatButton } from "@angular/material/button";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-empty-cart",
  imports: [MatButton, RouterLink],
  template: `
    <div class="flex flex-col items-center justify-center gap-2">
      <img src="/assets/empty_cart.png" alt="Empty Cart" class="w-64 h-64 object-contain" />
      <ng-content select="[message]"></ng-content>
      <a matButton="filled" class="mt-2" routerLink="/products">Esplora i prodotti</a>
    </div>
  `,
  styles: ``,
})
export default class EmptyCart {}
