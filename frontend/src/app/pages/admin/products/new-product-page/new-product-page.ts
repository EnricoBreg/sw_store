import { Component } from "@angular/core";
import ProductForm from "../../../../components/product-form/product-form";
import { MatDivider } from "@angular/material/divider";

@Component({
  selector: "app-new-product-page",
  imports: [ProductForm, MatDivider],
  host: {
    class: "space-y-4",
  },
  template: `
    <section>
      <h1 class="mb-2 text-2xl font-semibold">Nuovo prodotto</h1>
      <mat-divider></mat-divider>
    </section>
    <div>
      <app-product-form />
    </div>
  `,
  styles: ``,
})
export default class NewProductPage {}
