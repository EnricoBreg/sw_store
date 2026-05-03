import { Component, inject, signal } from '@angular/core';
import { MatSidenavContainer, MatSidenavContent, MatSidenav } from "@angular/material/sidenav"
import CategoriesList from '../../components/categories-list/categories-list';
import { ProductsService } from '../../core/services/products.service';
import Product from '../../core/models/product';
import { PaginationMeta } from '../../core/models/api-types';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconButton } from "@angular/material/button"
import { MatIcon } from "@angular/material/icon";

@Component({
  selector: 'app-products-grid',
  imports: [
    MatSidenavContainer,
    MatSidenavContent,
    MatSidenav,
    CategoriesList,
    MatProgressSpinner,
    MatPaginatorModule,
    MatIconButton,
    MatIcon,
  ],
  template: `
    <mat-sidenav-container class="mt-2">
      <mat-sidenav mode="side" opened="true">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900">Categories</h3>

          <app-categories-list />
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <section>
          <h1 class="text-2xl font-bold text-gray-900">Our Products</h1>

          @if (isLoading()) {
            <div>
              <mat-spinner></mat-spinner>
            </div>
          }

          @if (errorMessage()) {
            <div class="text-red-500 text-lg">
              {{ errorMessage() }}
            </div>
          }

          <div class="responsive-grid">
            @for (product of products(); track product.id) {
              <div
                class="w-72 bg-white shadow-md rounded-xl duration-500 hover:scale-102 hover:shadow-xl"
              >
                <div>
                  <img
                    [src]="product.image_url"
                    alt="Product"
                    class="h-80 w-72 object-cover rounded-t-xl"
                  />
                  <div class="px-4 py-3 w-72">
                    <!-- <span class="text-gray-400 mr-3 uppercase text-xs">Brand</span> -->
                    <p class="text-lg font-bold text-black truncate block capitalize">
                      {{ product.name }}
                    </p>
                    <div class="flex items-center">
                      <p class="text-lg font-semibold text-black cursor-auto my-3">
                        €{{ product.price }}
                      </p>
                      <!-- <del>
                        <p class="text-sm text-gray-600 cursor-auto ml-2">$199</p>
                      </del> -->
                      <div class="ml-auto">
                        <button matIconButton>
                          <mat-icon>add_shopping_cart</mat-icon>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            }
          </div>

          <mat-paginator
            [length]="pagination()?.count"
            [pageSize]="10"
            [pageSizeOptions]="[5, 10, 30]"
            aria-label="Seleziona pagina"
          >
          </mat-paginator>
        </section>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: ``,
})
export default class ProductsGrid {
  private service = inject(ProductsService);

  products = signal<Product[]>([]);
  pagination = signal<PaginationMeta | null>(null);
  isLoading = signal<boolean>(false);
  errorMessage = signal<string | null>(null);

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts(page: number = 1) {
    this.isLoading.set(true);

    this.service.list(page).subscribe({
      next: (response) => {
        this.products.set(response.data);
        this.pagination.set(response.meta || null);
        this.isLoading.set(false);
      },
      error: (err) => {
        this.errorMessage.set(err?.error.message || 'Errore nel caricamento dei prodotti.');
        this.isLoading.set(false);
      },
    });
  }
}
