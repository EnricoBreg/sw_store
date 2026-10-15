import { Component, computed, inject, input } from "@angular/core";
import Product from "../../core/models/product";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton } from "@angular/material/button";
import { WishlistsService } from "../../core/services/wishlists.service";
import { AuthService } from "../../core/services/auth.service";

@Component({
  selector: "app-toggle-wishlist-button",
  imports: [MatIcon, MatIconButton],
  template: `
    <!-- La wishlist è salvata sul backend per l'utente: agli ospiti il pulsante non viene mostrato -->
    @if (authenticated()) {
      <button
        class="w-10 h-10 rounded-full !bg-white border-0 shadow-md flex items-center justify-center cursor-pointer transition-all duration-200 hover:scale-110 hover:shadow-lg"
        [class]="isInWishlist() ? '!text-red-500' : '!text-gray-500'"
        matIconButton
        [attr.aria-label]="isInWishlist() ? removeLabel : addLabel"
        [attr.aria-pressed]="isInWishlist()"
        (click)="toggleWishlist(product())"
      >
        <mat-icon>{{ isInWishlist() ? "favorite" : "favorite_border" }}</mat-icon>
      </button>
    }
  `,
  styles: ``,
})
export default class ToggleWishlistButton {
  product = input.required<Product>();

  private readonly service = inject(WishlistsService);

  readonly authenticated = inject(AuthService).authenticated;

  readonly addLabel = $localize`:@@toggleWishlist.add:Aggiungi alla wishlist`;
  readonly removeLabel = $localize`:@@toggleWishlist.remove:Rimuovi dalla wishlist`;

  wishlist = this.service.wishlist;

  isInWishlist = computed(() => {
    const wishlist = this.wishlist();
    return !!wishlist && wishlist.items.some((i) => i.product.id === this.product().id);
  });

  toggleWishlist(product: Product) {
    if (this.isInWishlist()) {
      this.service.removeFromWishlist(product);
    } else {
      this.service.addToWishlist(product);
    }
  }
}
