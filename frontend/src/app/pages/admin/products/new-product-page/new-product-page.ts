import { Component } from "@angular/core";
import ProductForm from "../../../../components/product-form/product-form";
import { MatDivider } from "@angular/material/divider";
import { BackButton } from "../../../../components/back-button/back-button";

@Component({
  selector: "app-new-product-page",
  imports: [ProductForm, MatDivider, BackButton],
  host: {
    class: "space-y-4",
  },
  template: `
    <app-back-button class="mb-10">
      <ng-container i18n="@@back">Indietro</ng-container>
    </app-back-button>
    <section>
      <h1 i18n="@@newProduct.title" class="mb-2 text-2xl font-semibold">Nuovo prodotto</h1>
      <mat-divider></mat-divider>
    </section>
    <div>
      <app-product-form />
    </div>
  `,
  styles: ``,
})
export default class NewProductPage {}
