import { Component, inject, input } from "@angular/core";
import { ProductsService } from "../../core/services/products.service";
import { handleImageError } from "../../core/utils";
import InstockBadge from "../../components/instock-badge/instock-badge";
import ProductPrice from "../../components/product-price/product-price";
import Spinner from "../../components/spinner/spinner";

@Component({
  selector: "app-product-detail",
  imports: [InstockBadge, ProductPrice, Spinner],
  template: `
    <div class="max-w-[1200px] mx-auto mt-12 bg-white rounded-xl border border-1 flex flex-col md:flex-row elevated">
      
      @if (isLoading()) {
        <app-spinner />
      }

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

          <p class="text-gray-600 mt-6">
            {{ product?.description }}
          </p>

          <div class="mt-6">
            <app-product-price [product]="product!" className="text-2xl" />
          </div>
        </section>
      }
    </div>
  `,
  styles: ``,
})
export default class ProductDetail {
  productId = input<number>();

  private service = inject(ProductsService);
  product = this.service.product;
  isLoading = this.service.isLoading;
  error = this.service.error;

  protected readonly handleImageError = handleImageError;

  ngOnInit() {
    this.service.getById(this.productId()!);
  }
}
