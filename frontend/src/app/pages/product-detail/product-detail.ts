import { Component, inject, input, signal } from "@angular/core";
import { ProductsService } from "../../core/services/products.service";
import { handleImageError } from "../../core/utils";
import InstockBadge from "../../components/instock-badge/instock-badge";
import ProductPrice from "../../components/product-price/product-price";
import { MatIcon } from "@angular/material/icon";
import { MatAnchor } from "@angular/material/button";
import { CartService } from "../../core/services/cart.service";
import { AuthService } from "../../core/services/auth-service";
import { RouterLink } from "@angular/router";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import QuantitySelector from "../../components/quantity-selector/quantity-selector";

@Component({
  selector: "app-product-detail",
  imports: [
    InstockBadge,
    ProductPrice,
    MatIcon,
    MatAnchor,
    RouterLink,
    ViewPanel,
    QuantitySelector
],
  template: `
    <div appViewPanel class="max-w-[1200px] mx-auto mt-12 flex flex-col md:flex-row">
      @if (error()) {
        <div class="text-red-500 text-lg">
          {{ error() }}
        </div>
      }

      @if (product(); as product) {
        <section class="flex justify-center md:max-w-[50%] m-2">
          <img
            [src]="product?.image_url || 'assets/no_image_500x500.png'"
            alt="Product"
            class="md:h-[500px] object-cover"
            (error)="handleImageError($event)"
          />
        </section>

        <section class="flex-1 flex flex-col py-10 px-6">
          <app-instock-badge [stockQuantity]="product!.stock_quantity" />
          <h1 class="text-2xl font-semibold mt-5">{{ product?.name }}</h1>

          <p class="text-gray-600 text-lg mt-6">
            {{ product?.description }}
          </p>

          <p class="mt-4 text-sm text-gray-400">
            Disponibità: {{ product.stock_quantity }} pezzo/i.
          </p>

          <div class="mt-6">
            <app-product-price [product]="product!" className="text-2xl" />
          </div>

          <div class="mt-4 flex items-center gap-3">
            @if (authService.authenticated()) {
              @if (product.stock_quantity > 0) {
                <app-quantity-selector
                  [currentQuantity]="1"
                  [maxQuantity]="product.stock_quantity"
                  (quantityChange)="selectedQuantity.update((v) => v + $event)"
                />

                <button matButton="filled" (click)="addToCart()">
                  <mat-icon>add_shopping_cart</mat-icon>
                  Aggiungi al carrello
                </button>
              } @else {
                <p class="text-gray-800">
                  Prodotto non più dispobile. Ti avviseremo quando tornerà in stock.
                </p>
              }
            } @else {
              <p class="text-gray-700">
                <a class="text-blue-400 underline" routerLink="/login">Accedi</a> per aggiungere
                questo prodotto al tuo carrello!
              </p>
            }
          </div>
        </section>
      }
    </div>
  `,
  styles: ``,
})
export default class ProductDetail {
  productId = input<number>();

  private productsService = inject(ProductsService);
  private cartService = inject(CartService);
  readonly authService = inject(AuthService);

  product = this.productsService.product;
  error = this.productsService.error;

  selectedQuantity = signal<number>(1);

  protected readonly handleImageError = handleImageError;

  ngOnInit() {
    this.productsService.getById(this.productId()!);
  }

  decrementQuantity() {
    if (this.selectedQuantity() === 0) {
      return;
    }
    this.selectedQuantity.update(() => this.selectedQuantity() - 1);
  }

  incrementQuantity() {
    if (this.selectedQuantity() === this.product()?.stock_quantity) {
      return;
    }
    this.selectedQuantity.update(() => this.selectedQuantity() + 1);
  }

  addToCart() {
    this.cartService.addToCart(this.product()!, this.selectedQuantity());
  }
}
