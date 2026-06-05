import { Component, inject } from "@angular/core";
import { WishlistsService } from "../../core/services/wishlists.service";
import ProductCard from "../product-card/product-card";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import ToggleWishlistButton from "../toggle-wishlist-button/toggle-wishlist-button";
import { MatIcon } from "@angular/material/icon";
import { MatButton, MatIconButton } from "@angular/material/button";
import Product from "../../core/models/product";
import { RouterLink } from "@angular/router";
import EmptyCart from "../empty-cart/empty-cart";

@Component({
  selector: "app-list-wishlist-items",
  imports: [ProductCard, ViewPanel, ToggleWishlistButton, MatIcon, MatIconButton, EmptyCart],
  template: `
    <div appViewPanel>
      @if (wishlist(); as wl) {
        @if (wl.items.length > 0) {
          <div class="flex flex-wrap justify-center gap-3 mx-auto">
            @for (item of wl.items; track item.product.id) {
              <app-product-card [product]="item.product">
                <ng-content wishlistToggleButton>
                  <app-toggle-wishlist-button
                    select
                    [product]="item.product"
                    class="!absolute z-10 top-3 right-3"
                  />
                </ng-content>

                <ng-content addToCartButton>
                  <button matIconButton (click)="moveToCart(item.product)">
                    <mat-icon>add_shopping_cart</mat-icon>
                  </button>
                </ng-content>
              </app-product-card>
            }
          </div>
        } @else {
          <app-empty-cart>
            <p message class="text-gray-500 font-semibold text-lg">
              La tua lista dei desideri è vuota. Aggiungi subito dei prodotti!😁
            </p>
          </app-empty-cart>
        }
      }
    </div>
  `,
  styles: ``,
})
export default class ListWishlistItems {
  private readonly service = inject(WishlistsService);

  wishlist = this.service.wishlist;

  moveToCart(product: Product) {
    this.service.moveToCart(product);
  }
}
