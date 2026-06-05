import { Component } from "@angular/core";
import ListWishlistItems from "../../components/list-wishlist-items/list-wishlist-items";

@Component({
  selector: "app-wishlist-page",
  imports: [ListWishlistItems],
  template: ` 
    <div class="mx-auto max-w-[1500px] py-6">
      <h1 class="text-3xl font-extrabold mb-4">La tua lista dei desideri</h1>
      <app-list-wishlist-items />
    </div>
  `,
  styles: ``,
})
export default class WishlistPage {}
