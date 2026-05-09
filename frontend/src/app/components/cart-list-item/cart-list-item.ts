import { Component, computed, input } from "@angular/core";
import { handleImageError } from "../../core/utils";
import { CartItem } from "../../core/models/cart";
import { CurrencyPipe } from "@angular/common";

import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";

@Component({
  selector: "app-cart-list-item",
  imports: [CurrencyPipe, MatIconButton, MatIcon],
  template: `
    <div class="grid grid-cols-3 grid-col-[3fr_1fr_1fr]">
      <div class="flex items-center gap-4">
        <img
          [src]="cartItem().product.image_url"
          (error)="handleImageError($event)"
          class="w-24 h-24 rounded-lg object-cover"
        />
        <div>
          <div class="text-gray-900 text-lg font-semibold">{{ cartItem().product.name }}</div>
          <div class="text-gray-600 text-lg">{{ cartItem().product.price | currency: "EUR" }}</div>
        </div>
      </div>

      <!-- TODO: Inserire il selettore della quantità -->

      <div class="flex flex-col items-end">
        <div class="text-right font-semibold trext-lg">
          {{ total() | currency: "EUR" }}
        </div>
      </div>

      <div class="flex -me-3">
        <button matIconButton (click)="moveToWishlist()">
          <mat-icon>favorite_button</mat-icon>
        </button>

        <button matIconButton class="bg-red-100 text-red-500" (click)="removeFromCart()">
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: ``,
})
export default class CartListItem {
  cartItem = input.required<CartItem>();

  protected readonly handleImageError = handleImageError;

  total = computed(() => (this.cartItem().product.price * this.cartItem().quantity).toFixed(2));

  moveToWishlist() {
    console.log("moved to wishliist");
  }

  removeFromCart() {
    console.log("Rimosso dal carrello");
  }
}
