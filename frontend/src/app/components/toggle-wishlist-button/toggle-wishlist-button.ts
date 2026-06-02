import { Component, computed, inject, input } from "@angular/core";
import Product from "../../core/models/product";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import { WishlistsService } from "../../core/services/wishlists.service";

@Component({
  selector: "app-toggle-wishlist-button",
  imports: [MatIcon, MatIconButton],
  template: `
    <button
      class="w-10 h-10 rounded-full !bg-white border-0 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-lg"
      [class]="isInWishlist() ? '!text-red-500' : '!text-gray-400'"
      matIconButton
      (click)="toggleWishlist(product())"
    >
      <mat-icon>{{ isInWishlist() ? "favorite" : "favorite_border" }}</mat-icon>
    </button>
  `,
  styles: ``,
})
export default class ToggleWishlistButton {
  product = input.required<Product>();

  private readonly service = inject(WishlistsService);

  wishlist = this.service.wishlist;

  isInWishlist = computed(() => {
    const wishlist = this.wishlist();
    return !!wishlist && wishlist.items.find((i) => i.product.id === this.product().id);
  });

  toggleWishlist(product: Product) {
    if (this.isInWishlist()) {
      this.service.removeFromWishlist(product);
    } else {
      this.service.addToWishlist(product);
    }
  }
}
