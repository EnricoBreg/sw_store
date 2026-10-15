import { Component, DestroyRef, inject, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { ReactiveFormsModule, FormControl } from '@angular/forms';
import { MatFormField, MatLabel, MatPrefix, MatSuffix } from '@angular/material/form-field';
import { MatInput } from '@angular/material/input';
import { debounceTime, distinctUntilChanged, map } from 'rxjs';
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

// Attesa (ms) dopo l'ultima digitazione prima di avviare la ricerca
export const SEARCH_DEBOUNCE_MS = 400;

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
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatInput,
    MatPrefix,
    MatSuffix,
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
          <div class="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <h1 i18n="@@products" class="text-3xl font-bold text-gray-900">I nostri prodotti</h1>

            <mat-form-field class="w-full md:max-w-sm" subscriptSizing="dynamic">
              <mat-label i18n="@@productsGrid.search.label">Cerca prodotti</mat-label>
              <mat-icon matPrefix>search</mat-icon>
              <input
                matInput
                type="search"
                data-testid="products-search"
                [formControl]="searchControl"
                i18n-placeholder="@@productsGrid.search.placeholder"
                placeholder="Nome del prodotto"
              />
              @if (searchControl.value) {
                <button
                  matSuffix
                  matIconButton
                  type="button"
                  i18n-aria-label="@@productsGrid.search.clear"
                  aria-label="Cancella la ricerca"
                  (click)="searchControl.setValue('')"
                >
                  <mat-icon>close</mat-icon>
                </button>
              }
            </mat-form-field>
          </div>

          @if (errorMessage()) {
            <div role="alert" class="text-red-500 text-lg">
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
                    <button
                      matIconButton
                      i18n-aria-label="@@productsGrid.addToCart"
                      aria-label="Aggiungi al carrello"
                      (click)="addToCart(product)"
                    >
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
              <p message i18n="@@noProductsFound" class="text-gray-500 text-lg text-center">
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
export default class ProductsGrid implements OnInit {
  private productsService = inject(ProductsService);
  private categoriesService = inject(CategoriesService);
  private cartService = inject(CartService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private destroyRef = inject(DestroyRef);
  readonly layoutService = inject(LayoutService);

  selectedCategory = this.categoriesService.selected;
  products = this.productsService.products;
  pagination = this.productsService.paginationMeta;
  errorMessage = this.productsService.error;

  sidenavOpened = this.layoutService.sidenavOpened;

  // Campo di ricerca testuale, sincronizzato con il parametro ?q= dell'URL
  readonly searchControl = new FormControl("", { nonNullable: true });
  private searchTerm = "";

  ngOnInit() {
    // L'URL è la fonte di verità della ricerca: a ogni cambio di ?q= si riparte da pagina 1
    this.route.queryParamMap
      .pipe(
        map((params) => (params.get("q") ?? "").trim()),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((searchTerm) => {
        this.searchTerm = searchTerm;
        if (this.searchControl.value.trim() !== searchTerm) {
          this.searchControl.setValue(searchTerm, { emitEvent: false });
        }
        this.loadProducts(1);
      });

    // Digitazione: dopo una breve pausa il termine viene scritto nell'URL
    this.searchControl.valueChanges
      .pipe(
        debounceTime(SEARCH_DEBOUNCE_MS),
        map((value) => value.trim()),
        distinctUntilChanged(),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((searchTerm) => {
        if (searchTerm === this.searchTerm) return;
        this.router.navigate([], {
          relativeTo: this.route,
          queryParams: { q: searchTerm || null },
          queryParamsHandling: "merge",
          replaceUrl: true,
        });
      });
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.loadProducts(event.page, event.limit);
  }

  onCategorySelection(event: { id?: number; name?: string }) {
    // Il cambio di categoria cambia l'insieme dei risultati: si torna alla prima pagina
    this.loadProducts(1);
  }

  addToCart(product: Product) {
    this.cartService.addToCart(product, 1);
  }

  private loadProducts(page: number, limit = this.pagination()?.limit) {
    this.productsService.loadProducts(page, limit, {
      categoryId: this.selectedCategory()?.id,
      searchTerm: this.searchTerm || undefined,
    });
  }
}
