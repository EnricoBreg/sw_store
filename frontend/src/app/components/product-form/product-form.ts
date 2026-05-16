import { Component, inject, input, OnInit } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatInput } from "@angular/material/input";
import { MatFormField, MatLabel, MatOption, MatSelect, MatSuffix } from "@angular/material/select";
import Product from "../../core/models/product";
import { CategoriesService } from "../../core/services/categories.service";
import { LoadingService } from "../../core/http/services/loading.service";
import { AdminProductsService } from "../../core/services/admin-products.service";

@Component({
  selector: "app-product-form",
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatSuffix,
    MatCheckbox,
    MatOption,
    MatSelect,
    MatButton,
  ],
  template: `
    <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
      <section formGroupName="product">
        <!-- Nome -->
        <mat-form-field>
          <mat-label>Nome</mat-label>
          <input
            matInput
            type="text"
            formControlName="name"
            placeholder="Inserisci il nome del prodotto"
          />
        </mat-form-field>

        <!-- Descrizione -->
        <mat-form-field>
          <mat-label>Descrizione</mat-label>
          <textarea
            matInput
            type="text"
            formControlName="description"
            placeholder="Inserisci una descrizione"
          ></textarea>
        </mat-form-field>

        <!-- Prezzo - Sconto - Stock quantity -->
        <div class="flex items-center gap-3">
          <mat-form-field>
            <mat-label>Prezzo</mat-label>
            <input
              matInput
              type="number"
              step="0.01"
              formControlName="price"
              placeholder="Inserisci il prezzo"
            />
            <span matSuffix class="mr-5 text-gray-500">€</span>
          </mat-form-field>

          <mat-form-field>
            <mat-label>Sconto</mat-label>
            <input
              matInput
              type="number"
              formControlName="discountPercentage"
              placeholder="Inserisci una percentuale di sconto"
            />
            <span matSuffix class="mr-5 text-gray-500">%</span>
          </mat-form-field>

          <mat-form-field class="ms-10">
            <mat-label>Quantità in stock</mat-label>
            <input
              matInput
              type="number"
              formControlName="stockQuantity"
              placeholder="Inserisci la quantità disponibile"
            />
            <span matSuffix class="mr-5 text-gray-500">Pezzi</span>
          </mat-form-field>
        </div>

        <!-- Active -->
        <mat-checkbox formControlName="active">Attivo / Disponibile</mat-checkbox>

        <!-- Categoria -->
        <mat-form-field class="mt-5">
          <mat-label>Categoria prodotto</mat-label>
          <mat-select formControlName="category">
            @for (cat of categories(); track cat.id) {
              <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
            }
          </mat-select>
        </mat-form-field>

        <div class="mb-6 flex items-center gap-4">
          <p class="text-sm text-gray-600">Immagine dimostrativa del prodotto:</p>
          <input
            #fileInput
            type="file"
            accept="image/*"
            class="hidden"
            (change)="onFileSelected($event)"
          />
          <button type="button" mat-stroked-button (click)="fileInput.click()">
            Scegli immagine
          </button>
          @if (selectedFileName) {
            <span>{{ selectedFileName }}</span>
          }
        </div>
      </section>

      <!-- Submit -->
      <div class="mt-4">
        <button type="submit" mat-flat-button [disabled]="productForm.invalid || isLoading()">
          {{ isLoading() ? "Salvataggio..." : product() ? "Aggiorna prodotto" : "Crea prodotto" }}
        </button>
      </div>
    </form>
  `,
  styles: ``,
})
export default class ProductForm implements OnInit {
  product = input<Product | undefined>();

  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(AdminProductsService);
  private readonly loadingService = inject(LoadingService);

  readonly categories = this.categoriesService.categories;
  readonly isLoading = this.loadingService.isLoading;

  selectedFileName: string = "";

  private readonly fb = inject(FormBuilder);
  readonly productForm = this.fb.group({
    product: this.fb.group({
      name: ["", [Validators.required, Validators.minLength(5)]],
      description: ["", [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0.01)]],
      discountPercentage: [0, [Validators.required]],
      stockQuantity: [1, [Validators.required, Validators.min(0)]],
      active: [true, [Validators.required]],
      category: [null, [Validators.required]],
      image: [null as File | null],
    }),
  });

  onFileSelected(event: Event) {
    const element = event.target as HTMLInputElement;
    const file = element.files?.[0];

    if (file) {
      this.selectedFileName = file.name;

      this.productForm.get("product.image")?.setValue(file);
      this.productForm.get("product.image")?.updateValueAndValidity();
    }
  }

  ngOnInit() {
    this.categoriesService.loadCategories(1, 100);
  }

  onSubmit() {
    if (this.productForm.invalid) return;

    const raw = this.productForm.value.product!;

    // Rails si aspetta i campi wrappati: product[name], product[price], ecc.
    const fd = new FormData();
    fd.append("product[name]", raw.name ?? "");
    fd.append("product[description]", raw.description ?? "");
    fd.append("product[price]", String(raw.price ?? 0));
    fd.append("product[discount_percentage]", String(raw.discountPercentage ?? 0));
    fd.append("product[stock_quantity]", String(raw.stockQuantity ?? 0));
    fd.append("product[active]", String(raw.active ?? false));
    fd.append("product[category_id]", String(raw.category ?? ""));
    if (raw.image) {
      fd.append("product[image]", raw.image);
    }

    const existingProduct = this.product();
    if (existingProduct) {
      this.productsService.updateProduct(existingProduct.id, fd);
    } else {
      this.productsService.createProduct(fd);
    }
  }
}
