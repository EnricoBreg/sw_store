import { Component, computed, inject, input } from "@angular/core";
import { MatAnchor, MatButton } from "@angular/material/button";
import { MatIcon } from "@angular/material/icon";
import { RouterLink } from "@angular/router";
import { AdminProductsService } from "../../../../core/services/admin-products.service";
import { CurrencyPipe, NgClass } from "@angular/common";
import { computeDiscountPrice, handleImageError } from "../../../../core/utils";
import { BackButton } from "../../../../components/back-button/back-button";
import StockBadge from "../../../../components/stock-badge/stock-badge";
import DiscountBadge from "../../../../components/discount-badge/discount-badge";

@Component({
  selector: "app-product-detail-page",
  imports: [MatAnchor, MatIcon, RouterLink, CurrencyPipe, BackButton, MatButton, StockBadge, DiscountBadge],
  template: `
    <div>
      <app-back-button class="mb-10">
        Torna alla lista dei prodotti
      </app-back-button>

      <div class="mb-6">
        <h3 class="mb-2 text-xl font-semibold">Dettagli prodotto</h3>
        <p>
          Questa è la pagina dei dettagli del prodotto. Qui puoi visualizzare e modificare le
          informazioni del prodotto selezionato.
        </p>
      </div>

      <div>
        @if (product(); as prod) {
          <h4 class="mb-10 text-lg font-semibold">Informazioni prodotto:</h4>

          <div class="flex flex-col md:flex-row gap-5 items-center lg:items-start">
            <img
              [src]="prod.image_url"
              [alt]="prod.name"
              class="h-100 w-100 lg:h-md lg:max-w-md object-cover rounded-xl"
              (error)="handleImageError($event)"
            />

            <!-- Informazioni generali -->
            <div>
              <h1 class="text-2xl font-bold">{{ prod.name }}</h1>
              <div class="my-2 text-gray-700">
                <p class="font-semibold text-lg">Identificativo (ID):</p>
                <p class="text-lg">{{ prod.id }}</p>
              </div>
              <div class="my-2 text-gray-700">
                <p class="font-semibold text-lg">Descrizione:</p>
                <p class="text-lg">{{ prod.description }}</p>
              </div>
              <div class="my-2 text-gray-700">
                <p class="font-semibold text-lg">Categoria:</p>
                <p class="text-lg">{{ prod.category.name }} (ID: {{ prod.category.id }})</p>
              </div>
            </div>
          </div>

          <!-- Informazioni su prezzo, sconto, quantità disponibile -->
          <div class="overflow-hidden rounded-xl border border-gray-200 bg-white mt-6">
            <div class="overflow-x-auto">
              <table class="min-w-full text-left text-sm whitespace-nowrap">
                <thead class="bg-gray-50 text-gray-700">
                  <tr>
                    <th scope="col" class="px-6 py-4 font-semibold border-b border-gray-200">
                      Prezzo
                    </th>
                    <th scope="col" class="px-6 py-4 font-semibold border-b border-gray-200">
                      Sconto
                    </th>
                    <th scope="col" class="px-6 py-4 font-semibold border-b border-gray-200">
                      Prezzo effettivo
                    </th>
                    <th scope="col" class="px-6 py-4 font-semibold border-b border-gray-200">
                      Quantità disponibile
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200">
                  <tr class="hover:bg-gray-50 transition-colors duration-200">
                    <!-- Prezzo originale -->
                    <td class="px-6 py-4 font-medium text-lg text-gray-900">
                      {{ prod.price | currency: "EUR" }}
                    </td>

                    <!-- Percentuale di sconto -->
                    <td class="px-6 py-4">
                      <app-discount-badge [discount_percentage]="prod.discount_percentage" />
                    </td>

                    <!-- Prezzo effettivo (sconto applicato) -->
                    <td class="px-6 py-4 font-medium text-lg text-gray-900">
                      {{
                        computeDiscountPrice(prod.price, prod.discount_percentage) | currency: "EUR"
                      }}
                    </td>

                    <!-- Quantità disponibile per la vendita -->
                    <td class="px-6 py-4">
                      <app-stock-badge [stock_quantity]="prod.stock_quantity" />
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div class="flex items-center gap-2">
            <a matButton="filled" [routerLink]="['edit']" class="mt-6">
              <mat-icon>edit</mat-icon>
              Modifica
            </a>

            <a matButton="outlined" color="warn" class="mt-6">
              <mat-icon>delete</mat-icon>
              Elimina (non implementato)
            </a>
          </div>
        } @else {
          <p class="text-red-500">Non è stato possibile caricare i dettagli del prodotto.</p>
        }
      </div>
    </div>
  `,
  styles: ``,
})
export default class ProductDetailPage {
  productId = input.required<number>();

  private readonly service = inject(AdminProductsService);

  readonly product = this.service.product;
  readonly error = this.service.error;

  readonly handleImageError = handleImageError;
  readonly computeDiscountPrice = computeDiscountPrice;

  ngOnInit() {
    this.service.getById(this.productId());
  }
}
