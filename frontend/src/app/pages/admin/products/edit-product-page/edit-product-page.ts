import { Component, inject, input } from "@angular/core";
import { AdminProductsService } from "../../../../core/services/admin-products.service";
import { MatDivider } from "@angular/material/divider";
import ProductForm from "../../../../components/product-form/product-form";
import { BackButton } from "../../../../components/back-button/back-button";

@Component({
  selector: "app-product-detail-page",
  imports: [MatDivider, ProductForm, BackButton],
  host: {
    class: "space-y-4",
  },
  template: `
    <app-back-button class="mb-10" navigateTo="/admin/products">Torna alla lista dei prodotti</app-back-button>

    <section>
      <h1 class="mb-2 text-2xl font-semibold">Nuovo prodotto</h1>
      <mat-divider></mat-divider>
      <div>
        <app-product-form [product]="product()" />
      </div>
    </section>
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
