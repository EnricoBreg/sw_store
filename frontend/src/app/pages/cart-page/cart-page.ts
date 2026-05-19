import { Component } from "@angular/core";
import SummarizeOrder from "../../components/summarize-order/summarize-order";
import { MatAnchor } from "@angular/material/button";
import ListCartItems from "../../components/list-cart-items/list-cart-items";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-cart-page",
  imports: [SummarizeOrder, MatAnchor, ListCartItems, RouterLink],
  template: `
    <div class="mx-auto max-w-[1200px] py-6">
      <h1 class="text-3xl font-extrabold mb-4">Il tuo carrello</h1>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <app-list-cart-items />
        </div>

        <div>
          <app-summarize-order>
            <ng-container actionButtons>
              <div class="mt-4 border-t-1">
                <button matButton="filled" class="w-full mt-4 py-3" routerLink="/checkout">
                  Procedi al checkout
                </button>
              </div>
            </ng-container>
          </app-summarize-order>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class CartPage {
  proceedToCheckout() {}
}
