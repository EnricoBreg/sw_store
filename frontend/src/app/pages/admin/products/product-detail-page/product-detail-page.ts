import { Component, inject, input } from "@angular/core";
import { AdminProductsService } from "../../../../core/services/admin-products.service";
import { MatDivider } from "@angular/material/divider";
import ProductForm from "../../../../components/product-form/product-form";

@Component({
  selector: "app-product-detail-page",
  imports: [MatDivider, ProductForm],
  host: {
    class: "space-y-4",
  },
  template: `
    <section>
      <h1 class="mb-2 text-2xl font-semibold">Nuovo prodotto</h1>
      <mat-divider></mat-divider>
    </section>
    <div>
      <app-product-form [product]="product()" />
    </div>
  `,
  styles: ``,
})
export default class ProductDetailPage {
  productId = input.required<number>();

  productService = inject(AdminProductsService);

  product = this.productService.product;
  error = this.productService.error;

  ngOnInit() {
    this.productService.getById(this.productId());
  }
}
