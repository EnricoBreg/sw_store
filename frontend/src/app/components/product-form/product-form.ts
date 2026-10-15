import { Component, computed, effect, inject, input, OnDestroy, OnInit, signal } from "@angular/core";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatIcon } from "@angular/material/icon";
import { MatInput } from "@angular/material/input";
import { MatError, MatFormField, MatLabel, MatOption, MatSelect, MatSuffix } from "@angular/material/select";
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import Product from "../../core/models/product";
import { CategoriesService } from "../../core/services/categories.service";
import { AdminProductsService } from "../../core/services/admin-products.service";
import { ErrorPanel } from "../../core/directives/error-panel";
import { handleImageError } from "../../core/utils";

// Vincoli dell'immagine prodotto (vedi backend/API.md): controllati anche lato client
export const PRODUCT_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
export const PRODUCT_IMAGE_MAX_BYTES = 5 * 1024 * 1024;

export interface ProductFormValue {
  name: string;
  description: string;
  price: number;
  discountPercentage: number;
  stockQuantity: number;
  active: boolean;
  category: number | null;
}

/** Messaggio di errore per un file immagine non accettato, oppure null se va bene. */
export function validateProductImage(file: File): string | null {
  if (!PRODUCT_IMAGE_TYPES.includes(file.type)) {
    return $localize`:@@productForm.image.invalidType:Formato non supportato: usa un'immagine JPEG, PNG o WebP.`;
  }
  if (file.size > PRODUCT_IMAGE_MAX_BYTES) {
    return $localize`:@@productForm.image.tooLarge:L'immagine supera la dimensione massima di 5 MB.`;
  }
  return null;
}

/**
 * Corpo multipart della richiesta: Rails si aspetta i campi wrappati (product[name], ...).
 * `image` sostituisce l'immagine attuale; `removeImage` la rimuove (solo se non c'è un nuovo file).
 */
export function buildProductFormData(
  value: ProductFormValue,
  image: File | null,
  removeImage: boolean,
): FormData {
  const fd = new FormData();
  fd.append("product[name]", value.name);
  fd.append("product[description]", value.description);
  fd.append("product[price]", String(value.price));
  fd.append("product[discount_percentage]", String(value.discountPercentage ?? 0));
  fd.append("product[stock_quantity]", String(value.stockQuantity));
  fd.append("product[active]", String(value.active));
  fd.append("product[category_id]", String(value.category ?? ""));
  if (image) {
    fd.append("product[image]", image);
  } else if (removeImage) {
    fd.append("product[remove_image]", "true");
  }
  return fd;
}

@Component({
  selector: "app-product-form",
  imports: [
    ReactiveFormsModule,
    MatFormField,
    MatInput,
    MatLabel,
    MatError,
    MatSuffix,
    MatCheckbox,
    MatOption,
    MatSelect,
    MatButton,
    MatIcon,
    MatProgressSpinner,
    ErrorPanel,
  ],
  template: `
    @if (formError(); as error) {
      <div appErrorPanel role="alert" data-testid="product-form-error" class="mb-4">
        <p class="font-semibold">{{ error.message }}</p>
        @if (error.errors.length) {
          <ul class="list-disc list-inside mt-2">
            @for (e of error.errors; track $index) {
              <li>{{ e }}</li>
            }
          </ul>
        }
      </div>
    }

    <form [formGroup]="productForm" (ngSubmit)="onSubmit()">
      <section formGroupName="product">
        <!-- Nome -->
        <mat-form-field>
          <mat-label i18n="@@productForm.name.label">Nome</mat-label>
          <input
            matInput
            type="text"
            formControlName="name"
            i18n-placeholder="@@productForm.name.placeholder"
            placeholder="Inserisci il nome del prodotto"
          />
          <mat-error i18n="@@productForm.name.required">Il nome è obbligatorio.</mat-error>
        </mat-form-field>

        <!-- Descrizione -->
        <mat-form-field>
          <mat-label i18n="@@productForm.description.label">Descrizione</mat-label>
          <textarea
            matInput
            formControlName="description"
            i18n-placeholder="@@productForm.description.placeholder"
            placeholder="Inserisci una descrizione"
          ></textarea>
          <mat-error i18n="@@productForm.description.minLength">
            La descrizione è obbligatoria e deve avere almeno 10 caratteri.
          </mat-error>
        </mat-form-field>

        <!-- Prezzo - Sconto - Stock quantity -->
        <div class="flex flex-wrap items-start gap-3">
          <mat-form-field>
            <mat-label i18n="@@productForm.price.label">Prezzo</mat-label>
            <input
              matInput
              type="number"
              step="0.01"
              min="0"
              formControlName="price"
              i18n-placeholder="@@productForm.price.placeholder"
              placeholder="Inserisci il prezzo"
            />
            <span matSuffix class="mr-5 text-gray-600">€</span>
            <mat-error i18n="@@productForm.price.invalid">Inserisci un prezzo maggiore o uguale a 0.</mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label i18n="@@productForm.discount.label">Sconto</mat-label>
            <input
              matInput
              type="number"
              min="0"
              max="100"
              formControlName="discountPercentage"
              i18n-placeholder="@@productForm.discount.placeholder"
              placeholder="Inserisci una percentuale di sconto"
            />
            <span matSuffix class="mr-5 text-gray-600">%</span>
            <mat-error i18n="@@productForm.discount.invalid">Lo sconto deve essere tra 0 e 100.</mat-error>
          </mat-form-field>

          <mat-form-field>
            <mat-label i18n="@@productForm.stock.label">Quantità in stock</mat-label>
            <input
              matInput
              type="number"
              min="0"
              formControlName="stockQuantity"
              i18n-placeholder="@@productForm.stock.placeholder"
              placeholder="Inserisci la quantità disponibile"
            />
            <span matSuffix class="mr-5 text-gray-600" i18n="@@productForm.stock.unit">Pezzi</span>
            <mat-error i18n="@@productForm.stock.invalid">Inserisci una quantità maggiore o uguale a 0.</mat-error>
          </mat-form-field>
        </div>

        <!-- Active -->
        <mat-checkbox formControlName="active" i18n="@@productForm.active">Attivo / Disponibile</mat-checkbox>

        <!-- Categoria -->
        <div class="lg:w-1/2">
          <mat-form-field class="mt-5">
            <mat-label i18n="@@productForm.category.label">Categoria prodotto</mat-label>
            <mat-select formControlName="category" data-testid="product-category">
              @for (cat of categories(); track cat.id) {
                <mat-option [value]="cat.id">{{ cat.name }}</mat-option>
              }
            </mat-select>
            <mat-error i18n="@@productForm.category.required">Scegli una categoria.</mat-error>
          </mat-form-field>
        </div>
      </section>

      <!-- Immagine: anteprima, scelta, sostituzione, rimozione -->
      <fieldset class="mb-6">
        <legend class="text-sm text-gray-700 mb-2" i18n="@@productForm.image.label">
          Immagine dimostrativa del prodotto:
        </legend>

        <div class="flex flex-wrap items-center gap-4">
          @if (previewUrl(); as url) {
            <img
              [src]="url"
              alt=""
              data-testid="product-image-preview"
              class="h-32 w-32 object-cover rounded-xl border border-gray-200"
              (error)="handleImageError($event)"
            />
          } @else {
            <p class="text-sm text-gray-600" data-testid="product-image-none" i18n="@@productForm.image.none">
              Nessuna immagine.
            </p>
          }

          <input
            #fileInput
            type="file"
            class="sr-only"
            data-testid="product-image-input"
            [accept]="acceptedTypes"
            i18n-aria-label="@@productForm.image.inputLabel"
            aria-label="File dell'immagine del prodotto"
            (change)="onFileSelected($event)"
          />
          <button type="button" matButton="outlined" (click)="fileInput.click()">
            <mat-icon>upload</mat-icon>
            @if (previewUrl()) {
              <span i18n="@@productForm.image.replace">Sostituisci immagine</span>
            } @else {
              <span i18n="@@productForm.image.choose">Scegli immagine</span>
            }
          </button>
          @if (previewUrl()) {
            <button type="button" matButton data-testid="product-image-remove" (click)="removeImage(fileInput)">
              <mat-icon>delete</mat-icon>
              <span i18n="@@productForm.image.remove">Rimuovi immagine</span>
            </button>
          }
          @if (selectedFile(); as file) {
            <span class="text-sm text-gray-700">{{ file.name }}</span>
          }
        </div>

        <p class="mt-2 text-sm text-gray-600" i18n="@@productForm.image.hint">JPEG, PNG o WebP, al massimo 5 MB.</p>
        @if (imageError(); as message) {
          <p role="alert" data-testid="product-image-error" class="mt-1 text-sm text-red-700">{{ message }}</p>
        }
      </fieldset>

      <!-- Submit -->
      <div class="mt-4">
        <button
          type="submit"
          matButton="filled"
          data-testid="product-submit"
          [disabled]="productForm.invalid || saving()"
          [attr.aria-busy]="saving()"
        >
          @if (saving()) {
            <span class="inline-flex items-center gap-2">
              <mat-progress-spinner mode="indeterminate" diameter="18" aria-hidden="true" />
              {{ savingLabel }}
            </span>
          } @else {
            {{ product() ? updateLabel : createLabel }}
          }
        </button>
      </div>
    </form>
  `,
  styles: ``,
})
export default class ProductForm implements OnInit, OnDestroy {
  product = input<Product | null | undefined>();

  private readonly categoriesService = inject(CategoriesService);
  private readonly productsService = inject(AdminProductsService);
  private readonly fb = inject(FormBuilder);

  readonly categories = this.categoriesService.categories;
  readonly saving = this.productsService.saving;
  readonly formError = this.productsService.formError;

  readonly acceptedTypes = PRODUCT_IMAGE_TYPES.join(",");
  readonly selectedFile = signal<File | null>(null);
  readonly removeExistingImage = signal(false);
  readonly imageError = signal<string | null>(null);
  private readonly selectedFileUrl = signal<string | null>(null);

  /** Anteprima: il file scelto, altrimenti l'immagine attuale del prodotto (se non rimossa). */
  readonly previewUrl = computed(() => {
    if (this.selectedFileUrl()) return this.selectedFileUrl();
    if (this.removeExistingImage()) return null;
    return this.product()?.image_url ?? null;
  });

  readonly productForm = this.fb.nonNullable.group({
    product: this.fb.nonNullable.group({
      name: ["", [Validators.required]],
      description: ["", [Validators.required, Validators.minLength(10)]],
      price: [0, [Validators.required, Validators.min(0)]],
      discountPercentage: [0, [Validators.min(0), Validators.max(100)]],
      stockQuantity: [0, [Validators.required, Validators.min(0)]],
      active: [true],
      category: [null as number | null, [Validators.required]],
    }),
  });

  readonly handleImageError = handleImageError;

  readonly savingLabel = $localize`:@@productForm.submit.saving:Salvataggio...`;
  readonly updateLabel = $localize`:@@productForm.submit.update:Aggiorna prodotto`;
  readonly createLabel = $localize`:@@productForm.submit.create:Crea prodotto`;

  constructor() {
    // Il prodotto arriva in modo asincrono dalla pagina di modifica: il form viene popolato quando c'è
    effect(() => {
      const currentProduct = this.product();

      if (currentProduct) {
        this.productForm.patchValue({
          product: {
            name: currentProduct.name,
            description: currentProduct.description,
            price: currentProduct.price,
            active: currentProduct.active,
            discountPercentage: currentProduct.discount_percentage || 0,
            stockQuantity: currentProduct.stock_quantity || 0,
            category: currentProduct.category?.id ?? null,
          },
        });
      }
    });
  }

  ngOnInit() {
    this.productsService.resetForm();
    this.categoriesService.loadCategories();
  }

  ngOnDestroy() {
    this.revokePreview();
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    if (!file) return;

    const error = validateProductImage(file);
    if (error) {
      this.imageError.set(error);
      input.value = "";
      return;
    }

    this.imageError.set(null);
    this.revokePreview();
    this.selectedFile.set(file);
    this.selectedFileUrl.set(URL.createObjectURL(file));
  }

  /** Toglie il file scelto oppure, se non ce n'è uno, segna la rimozione dell'immagine attuale. */
  removeImage(input: HTMLInputElement) {
    input.value = "";
    this.imageError.set(null);
    if (this.selectedFile()) {
      this.revokePreview();
      this.selectedFile.set(null);
    } else {
      this.removeExistingImage.set(true);
    }
  }

  onSubmit() {
    if (this.productForm.invalid || this.saving()) return;

    const formData = buildProductFormData(
      this.productForm.getRawValue().product,
      this.selectedFile(),
      this.removeExistingImage(),
    );

    const existingProduct = this.product();
    if (existingProduct) {
      this.productsService.updateProduct(existingProduct.id, formData);
    } else {
      this.productsService.createProduct(formData);
    }
  }

  private revokePreview() {
    const url = this.selectedFileUrl();
    if (url) URL.revokeObjectURL(url);
    this.selectedFileUrl.set(null);
  }
}
