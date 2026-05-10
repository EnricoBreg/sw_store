import { Component, computed, inject, input } from "@angular/core";
import { handleImageError } from "../../core/utils";
import { CartItem } from "../../core/models/cart";
import { CurrencyPipe } from "@angular/common";

import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import ProductPrice from "../product-price/product-price";
import { CartService } from "../../core/services/cart.service";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-cart-list-item",
  imports: [CurrencyPipe, MatIconButton, MatIcon, ProductPrice, RouterLink],
  template: `
    @let product = cartItem().product;

    <div class="grid grid-cols-1 md:grid-cols-4">
      <div class="md:col-span-2 flex items-center gap-4">
        <img
          [src]="product.image_url"
          (error)="handleImageError($event)"
          class="w-24 h-24 rounded-lg object-cover"
        />
        <div>
          <a [routerLink]="['/products', product.id ]">
            <div class="text-gray-900 text-lg font-semibold underline">{{ product.name }}</div>
          </a>
          <app-product-price [product]="product" />
        </div>
      </div>

      
      <div class="flex flex-col items-end gap-4">
        <div>
          <!-- TODO: Inserire il selettore della quantità -->
          <span class="text-lg border-1 rounded-lg py-2 px-4 border-color-gray-500">
            {{ cartItem().quantity }}
          </span>
        </div>
        <div class="text-right font-semibold text-lg">
          {{ total() | currency: "EUR" }}
        </div>
      </div>

      <div class="flex -me-3 justify-end">
        <button
          matIconButton
          class="danger"
          (click)="cartService.removeFromCart(product)"
        >
          <mat-icon>delete</mat-icon>
        </button>
      </div>
    </div>
  `,
  styles: ``,
})
export default class CartListItem {
  cartItem = input.required<CartItem>();
  cartService = inject(CartService);

  protected readonly handleImageError = handleImageError;

  total = computed(() =>
    (
      this.cartItem().product.price *
      (1 - this.cartItem().product.discount_percentage / 100.0) *
      this.cartItem().quantity
    ).toFixed(2),
  );
}
