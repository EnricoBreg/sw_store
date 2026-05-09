import { Component, inject } from "@angular/core";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { CartService } from "../../core/services/cart.service";
import CartListItem from "../cart-list-item/cart-list-item";

@Component({
  selector: "app-list-cart-items",
  imports: [ViewPanel, CartListItem],
  template: `
    <div appViewPanel>
      <h2 class="text-2xl font-bold mb-4">Articoli nel carrello: {{ cartService.cartItemCount() }}</h2>
      <div class="flex flex-col gap-6">
        @for (item of cartService.cart()?.items; track item.product.id) {
          <app-cart-list-item [cartItem]="item" />
        }
      </div>
    </div>
  `,
  styles: ``,
})
export default class ListCartItems {
  readonly cartService = inject(CartService);
}
