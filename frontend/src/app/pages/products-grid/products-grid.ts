import { Component, inject } from '@angular/core';
import { MatSidenavContainer, MatSidenavContent, MatSidenav } from "@angular/material/sidenav"
import CategoriesList from '../../components/categories-list/categories-list';
import { ProductsService } from '../../core/services/products.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import ApiPaginator from '../../components/api-paginator/api-paginator';
import Spinner from '../../components/spinner/spinner';
import { CategoriesService } from '../../core/services/categories.service';
import ProductCard from '../../components/product-card/product-card';

@Component({
  selector: 'app-products-grid',
  imports: [
    MatSidenavContainer,
    MatSidenavContent,
    MatSidenav,
    CategoriesList,
    MatPaginatorModule,
    ApiPaginator,
    Spinner,
    ProductCard
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
              <app-product-card [product]="product" />
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
}
