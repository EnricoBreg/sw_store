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
    <app-back-button class="mb-10">
      <ng-container i18n="@@back">Indietro</ng-container>
    </app-back-button>

    <section>
      <h1 i18n="@@editProduct.title" class="mb-2 text-2xl font-semibold">Modifica prodotto</h1>
      <mat-divider></mat-divider>
      @if (product(); as product) {
        <div class="mt-4">
          <app-product-form [product]="product" />
        </div>
      } @else if (error(); as message) {
        <p role="alert" class="mt-4 text-red-700">{{ message }}</p>
      }
    </section>
  `,
  styles: ``,
})
export default class EditProductPage {
  productId = input.required<number>();

  productService = inject(AdminProductsService);

  product = this.productService.product;
  error = this.productService.error;

  ngOnInit() {
    this.productService.getById(this.productId());
  }
}
