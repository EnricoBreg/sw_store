import { Component, inject } from '@angular/core';
import { MatSidenavContainer, MatSidenavContent, MatSidenav } from "@angular/material/sidenav"
import CategoriesList from '../../components/categories-list/categories-list';
import { ProductsService } from '../../core/services/products.service';
import { MatProgressSpinner } from "@angular/material/progress-spinner";
import { MatPaginatorModule } from '@angular/material/paginator';
import { MatIconButton } from "@angular/material/button"
import { MatIcon } from "@angular/material/icon";
import ApiPaginator from '../../components/api-paginator/api-paginator';
import Spinner from '../../components/spinner/spinner';
import { CategoriesService } from '../../core/services/categories.service';

@Component({
  selector: 'app-products-grid',
  imports: [
    MatSidenavContainer,
    MatSidenavContent,
    MatSidenav,
    CategoriesList,
    MatPaginatorModule,
    MatIconButton,
    MatIcon,
    ApiPaginator,
    Spinner,
  ],
  template: `
    <mat-sidenav-container class="mt-2">
      <mat-sidenav mode="side" opened="true">
        <div class="p-6">
          <h3 class="text-lg font-semibold text-gray-900">Categories</h3>

          <app-categories-list (categorySelectEvent)="onCategorySelection($event)" />
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <section class="p-6 relative">
          <h1 class="text-3xl font-bold text-gray-900">Our Products</h1>

          @if (isLoading()) {
            <app-spinner />
          }

          @if (errorMessage()) {
            <div class="text-red-500 text-lg">
              {{ errorMessage() }}
            </div>
          }

          <div class="responsive-grid mt-4">
            @for (product of products(); track product.id) {
              <div
                class="w-72 bg-white shadow-md rounded-xl duration-500 hover:scale-102 hover:shadow-lg"
              >
                <div>
                  <img
                    [src]="product.image_url || 'assets/no_image_500x500.png'"
                    alt="Product"
                    class="h-80 w-72 object-cover rounded-t-xl"
                    (error)="handleImageError($event)"
                  />
                  <div class="px-4 py-3 w-72">
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

          <div class="mt-5">
            <app-api-paginator
              [meta]="pagination()"
              (pageChangeEvent)="onPageChangeEvent($event)"
            />
          </div>
        </section>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: ``,
})
export default class ProductsGrid {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  
  selectedCategory = this.categoriesService.selected;
  products = this.productsService.products;
  pagination = this.productsService.paginationMeta;
  isLoading = this.productsService.isLoading;
  errorMessage = this.productsService.error;

  ngOnInit() {
    this.productsService.loadProducts();
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.productsService.loadProducts(event.page, event.limit, this.selectedCategory()?.id);
  }

  onCategorySelection(event: { id?: number, name?: string }) {
    this.productsService.loadProducts(this.pagination()?.page, this.pagination()?.limit, event.id);
  }

  handleImageError(event: Event) {
    const imgElement = event?.target as HTMLImageElement;
    imgElement.src = 'assets/no_image_500x500.png';
  }
}
