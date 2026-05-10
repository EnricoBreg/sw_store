import { Component, computed, inject, input } from "@angular/core";
import Product from "../../core/models/product";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import { RouterLink } from "@angular/router";
import InstockBadge from "../instock-badge/instock-badge";
import { handleImageError } from "../../core/utils";
import ProductPrice from "../product-price/product-price";
import { CartService } from "../../core/services/cart.service";
import { AuthService } from "../../core/services/auth-service";

@Component({
  selector: "app-product-card",
  imports: [MatIcon, MatIconButton, RouterLink, InstockBadge, ProductPrice],
  template: `
    <div class="w-72 bg-white shadow-md rounded-xl duration-500 hover:scale-102 hover:shadow-lg">
      <div>
        <img
          [src]="product().image_url || 'assets/no_image_500x500.png'"
          alt="Product()"
          class="h-80 w-72 object-cover rounded-t-xl cursor-pointer"
          (error)="handleImageError($event)"
          [routerLink]="['/products', product().id]"
        />
        <div class="px-4 py-3 w-72">
          <app-instock-badge [stockQuantity]="product().stock_quantity" />
          <h3 class="text-lg font-bold text-black truncate block capitalize">
            {{ product().name }}
          </h3>
          <div class="flex items-center">
            <app-product-price [product]="product()" />
            @if (authService.authenticated()) {
              <div class="ml-auto">
                <button matIconButton (click)="addToCart()">
                  <mat-icon>add_shopping_cart</mat-icon>
                </button>
              </div>
            }
          </div>
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class ProductCard {
  product = input.required<Product>();
  authService = inject(AuthService);
  private cartService = inject(CartService);

  protected readonly handleImageError = handleImageError;

  discountPrice = computed(
    () => this.product().price * (1 - this.product().discount_percentage / 100.0),
  );

  discountPercentageInt = computed(() => Math.round(this.product().discount_percentage));

  priceColorClass = computed(() =>
    this.product().discount_percentage > 0 ? "text-red-500" : "text-black",
  );

  addToCart() {
    this.cartService.addToCart(this.product(), 1);
  }
}
