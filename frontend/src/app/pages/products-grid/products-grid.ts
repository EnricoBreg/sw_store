import { Component, computed, inject } from '@angular/core';
import { MatSidenavContainer, MatSidenavContent, MatSidenav, MatSidenavModule } from "@angular/material/sidenav"
import CategoriesList from '../../components/categories-list/categories-list';
import { ProductsService } from '../../core/services/products.service';
import { MatPaginatorModule } from '@angular/material/paginator';
import ApiPaginator from '../../components/api-paginator/api-paginator';
import { CategoriesService } from '../../core/services/categories.service';
import ProductCard from '../../components/product-card/product-card';
import { LayoutService } from '../../core/services/layout.service';
import ToggleWishlistButton from '../../components/toggle-wishlist-button/toggle-wishlist-button';
import { MatIcon } from "@angular/material/icon";
import { CartService } from '../../core/services/cart.service';
import Product from '../../core/models/product';
import { MatIconButton } from '@angular/material/button';
import NoProductFound from '../../components/no-product-found/no-product-found';
import ViewPanel from '../../core/directives/view-panel/view-panel';

@Component({
  selector: "app-products-grid",
  imports: [
    MatSidenavContainer,
    MatSidenavContent,
    MatSidenav,
    MatSidenavModule,
    CategoriesList,
    MatPaginatorModule,
    ApiPaginator,
    ProductCard,
    ToggleWishlistButton,
    MatIcon,
    MatIconButton,
    NoProductFound,
  ],
  template: `
    <mat-sidenav-container class="mt-2 full-height-layout" hasBackdrop="false">
      <mat-sidenav mode="side" [opened]="true">
        <div class="p-6">
          <h3 i18n="@@categories" class="text-lg font-semibold text-gray-900">Categorie</h3>

          <app-categories-list (categorySelectEvent)="onCategorySelection($event)" />
        </div>
      </mat-sidenav>
      <mat-sidenav-content>
        <section class="p-6 relative">
          <h1 i18n="@@products" class="text-3xl font-bold text-gray-900">I nostri prodotti</h1>

          @if (productsCount()) {
            <div class="text-red-500 text-lg">
              {{ errorMessage() }}
            </div>
          }

          @if (products().length) {
            <div class="responsive-grid mt-4">
              @for (product of products(); track product.id) {
                <app-product-card [product]="product">
                  <ng-content wishlistToggleButton>
                    <app-toggle-wishlist-button
                      [product]="product"
                      class="!absolute z-10 top-3 right-3"
                    />
                  </ng-content>

                  <ng-content addToCartButton>
                    <button matIconButton (click)="addToCart(product)">
                      <mat-icon>add_shopping_cart</mat-icon>
                    </button>
                  </ng-content>
                </app-product-card>
              }
            </div>

            <div class="mt-5">
              <app-api-paginator
                [meta]="pagination()"
                (pageChangeEvent)="onPageChangeEvent($event)"
              />
            </div>
          } @else {
            <app-no-product-found>
              <p i18n="@@noProductsFound" class="text-gray-500 text-lg text-center">
                Nessun prodotto trovato. Prova a selezionare un'altra categoria o ad usare altre parole chiave. In alternativa, ritorna più tardi!😁
              </p>
            </app-no-product-found>
          }
        </section>
      </mat-sidenav-content>
    </mat-sidenav-container>
  `,
  styles: ``,
})
export default class ProductsGrid {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private cartService = inject(CartService);
  readonly layoutService = inject(LayoutService);

  selectedCategory = this.categoriesService.selected;
  products = this.productsService.products;
  pagination = this.productsService.paginationMeta;
  errorMessage = this.productsService.error;

  sidenavOpened = this.layoutService.sidenavOpened;

  productsCount = computed(() => this.products().length);

  ngOnInit() {
    this.productsService.loadProducts();
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.productsService.loadProducts(event.page, event.limit, {
      categoryId: this.selectedCategory()?.id,
    });
  }

  onCategorySelection(event: { id?: number; name?: string }) {
    const categoryId = event.id;
    this.productsService.loadProducts(this.pagination()?.page, this.pagination()?.limit, {
      categoryId,
    });
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
  }
}
