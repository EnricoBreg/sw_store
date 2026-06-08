import { Component, computed, inject, signal } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import { UsersQuery } from "../../../../core/services/users.service";
import ApiPaginator from "../../../../components/api-paginator/api-paginator";
import { MatInput, MatFormField, MatLabel } from "@angular/material/input";
import { FormControl, ReactiveFormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, Subject, takeUntil } from "rxjs";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton, MatAnchor } from "@angular/material/button";
import { MatMenuItem, MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatSort, MatSortModule, MatSortHeader } from "@angular/material/sort";
import { CurrencyPipe } from "@angular/common";
import { computeDiscountPrice, handleImageError } from "../../../../core/utils";
import { RouterLink } from "@angular/router";
import { MatDivider } from "@angular/material/divider";
import { AdminProductsService } from "../../../../core/services/admin-products.service";
import StockBadge from "../../../../components/stock-badge/stock-badge";
import DiscountBadge from "../../../../components/discount-badge/discount-badge";
import CategorySelect from "../../../../components/category-select/category-select";

@Component({
  selector: "app-products-page",
  imports: [
    MatTableModule,
    ApiPaginator,
    MatInput,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatIcon,
    MatMenuModule,
    MatCheckbox,
    MatIconButton,
    MatSortHeader,
    MatSortModule,
    MatSort,
    CurrencyPipe,
    MatAnchor,
    RouterLink,
    MatMenuModule,
    MatMenuItem,
    MatMenuTrigger,
    MatDivider,
    StockBadge,
    DiscountBadge,
    CategorySelect,
  ],
  template: `
    <div class="space-y-4">
      <div>
        <h1 i18n="@@productsPage.title" class="font-bold text-2xl">I prodotti dello store</h1>
      </div>

      <!-- Ricerca prodotti -->
      <section class="md:w-4/5 space-y-4 mb-6">
        <p i18n="@@filters" class="text-lg font-semibold mb-3">Filtri</p>
        <!-- Serach bar -->
        <mat-form-field>
          <mat-label i18n="@@productsPage.search.label">Ricerca un prodotto</mat-label>
          <input
            matInput
            type="text"
            placeholder="Es. Tavolo da lavoro"
            i18n-placeholder="@@productsPage.search.placeholder"
            [formControl]="searchControl"
          />
        </mat-form-field>

        <div class="lg:w-1/2">
          <app-category-select (categorySelected)="onCategorySelectChange($event)" />
        </div>
      </section>

      <!-- Sezione delle azioni della table -->
      <section>
        <div class="mb-2 flex items-center justify-between">
          <div>
            <a matButton="filled" routerLink="new">
              <mat-icon>add</mat-icon>
              <ng-container i18n="@@productsPage.addProduct">Aggiungi prodotto</ng-container>
            </a>
          </div>

          <!-- Menu selezione colonne visibili -->
          <div>
            <button matIconButton [matMenuTriggerFor]="columnsMenu">
              <mat-icon>view_column</mat-icon>
            </button>
            <mat-menu #columnsMenu="matMenu">
              @for (col of allColumns; track col.key) {
                <div mat-menu-item (click)="$event.stopPropagation()">
                  <mat-checkbox
                    [checked]="visibleColumns().includes(col.key)"
                    (change)="toggleColumn(col.key)"
                  >
                    {{ col.label }}
                  </mat-checkbox>
                </div>
              }
            </mat-menu>
          </div>
        </div>

        <div class="w-full overflow-x-auto border border-gray-200 rounded-t-lg shadow-sm">
          <table mat-table [dataSource]="products()" matSort (matSortChange)="onSortChange($event)">
            <ng-container matColumnDef="product_image">
              <th i18n="@@productsPage.table.image" mat-header-cell *matHeaderCellDef>Anteprima</th>
              <td mat-cell *matCellDef="let product">
                <img
                  [src]="product.image_url"
                  [alt]="product.name"
                  class="h-24 w-24 object-cover rounded-xl cursor-pointer my-1"
                  (error)="handleImageError($event)"
                />
              </td>
            </ng-container>
            <ng-container matColumnDef="id">
              <th i18n="@@productsPage.table.id" mat-header-cell *matHeaderCellDef>ID</th>
              <td mat-cell *matCellDef="let product">{{ product.id }}</td>
            </ng-container>
            <ng-container matColumnDef="name">
              <th
                i18n="@@productsPage.table.name"
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                sortActionDescription="Ordina per nome"
              >
                Nome
              </th>
              <td mat-cell *matCellDef="let product">
                <span
                  class="text-lg font-semibold hover:underline cursor-pointer"
                  [matMenuTriggerFor]="productMenu"
                  >{{ product.name }}</span
                >
                <mat-menu #productMenu="matMenu" xPosition="before">
                  <div class="flex flex-col px-3 min-w-[200px]">
                    <span i18n="@@productsPage.fastActions.title" class="text-sm font-medium"
                      >Azioni rapide</span
                    >
                  </div>
                  <mat-divider></mat-divider>
                  <a class="!min-h-[32px]" mat-menu-item [routerLink]="[product.id]">
                    <mat-icon>visibility</mat-icon>
                    <ng-container i18n="@@productsPage.fastAction.vedi">Vedi</ng-container>
                  </a>
                  <a class="!min-h-[32px]" mat-menu-item [routerLink]="[product.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                    <ng-container i18n="@@productsPage.fastAction.modifica">Modifica</ng-container>
                  </a>
                </mat-menu>
              </td>
            </ng-container>
            <ng-container matColumnDef="description">
              <th
                i18n="@@productsPage.table.description"
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                sortActionDescription="Ordina per descrizione"
                i18n-sortActionDescription="@@productsPage.table.description.sort"
              >
                Descrizione
              </th>
              <td mat-cell *matCellDef="let product">{{ product.description }}</td>
            </ng-container>
            <ng-container matColumnDef="price">
              <th
                i18n="@@productsPage.table.price"
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                sortActionDescription="Ordina per prezzo"
                i18n-sortActionDescription="@@productsPage.table.price.sort"
              >
                Prezzo
              </th>
              <td mat-cell *matCellDef="let product">{{ product.price | currency: "EUR" }}</td>
            </ng-container>
            <ng-container matColumnDef="discount_percentage">
              <th
                i18n="@@productsPage.table.discount"
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                sortActionDescription="Ordina per sconto"
                i18n-sortActionDescription="@@productsPage.table.discount_percentage.sort"
              >
                Sconto
              </th>
              <td mat-cell *matCellDef="let product">
                <app-discount-badge [discountPercentage]="product.discount_percentage" />
              </td>
            </ng-container>
            <ng-container matColumnDef="discount_price">
              <th i18n="@@productsPage.table.discount_price" mat-header-cell *matHeaderCellDef>
                Prezzo effettivo
              </th>
              <td mat-cell *matCellDef="let product">
                {{
                  computeDiscountPrice(product.price, product.discount_percentage) | currency: "EUR"
                }}
              </td>
            </ng-container>
            <ng-container matColumnDef="stock_quantity">
              <th
                i18n="@@productsPage.table.stock_quantity"
                mat-header-cell
                *matHeaderCellDef
                mat-sort-header
                sortActionDescription="Ordina per quantità"
              >
                Stock
              </th>
              <td mat-cell *matCellDef="let product">
                <app-stock-badge [stock_quantity]="product.stock_quantity" />
              </td>
            </ng-container>
            <ng-container matColumnDef="category_name">
              <th i18n="@@productsPage.table.category_name" mat-header-cell *matHeaderCellDef>
                Categoria
              </th>
              <td mat-cell *matCellDef="let product">{{ product.category.name }}</td>
            </ng-container>
            <ng-container matColumnDef="actions">
              <th i18n="@@productsPage.table.actions" mat-header-cell *matHeaderCellDef>
                Azioni
              </th>
              <td mat-cell *matCellDef="let product">
                <div class="flex items-center gap-1">
                  <a matIconButton [routerLink]="[product.id]">
                    <mat-icon>visibility</mat-icon>
                  </a>
                  <a matIconButton [routerLink]="[product.id, 'edit']">
                    <mat-icon>edit</mat-icon>
                  </a>
                </div>
              </td>
            </ng-container>
            <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
          </table>
        </div>
        <div class="w-full border border-gray-200 rounded-b-lg shadow-sm">
          <app-api-paginator [meta]="pagination()" (pageChangeEvent)="onPageChangeEvent($event)" />
        </div>
      </section>
    </div>
  `,
  styles: ``,
})
export default class ProductsPage {
  service = inject(AdminProductsService);

  allColumns = [
    { key: "product_image", label: ":@@product.image:Anteprima" },
    { key: "id", label: ":@@product.id:ID" },
    { key: "name", label: ":@@product.name:Nome" },
    { key: "description", label: ":@@product.description:Descrizione" },
    { key: "price", label: ":@@product.price:Prezzo" },
    { key: "discount_percentage", label: ":@@product.discount_percentage:Sconto" },
    { key: "discount_price", label: ":@@product.discount_price:Prezzo effettivo" },
    { key: "stock_quantity", label: ":@@product.stock_quantity:Stock" },
    { key: "category_name", label: ":@@product.category_name:Categoria" },
    { key: "actions", label: ":@@product.actions:Azioni" },
  ];
  visibleColumns = signal<string[]>([
    "product_image",
    "id",
    "name",
    "price",
    "discount_percentage",
    "discount_price",
    "stock_quantity",
    "category_name",
    "actions",
  ]);
  displayedColumns = computed(() =>
    this.allColumns.map((c) => c.key).filter((key) => this.visibleColumns().includes(key)),
  );

  products = this.service.products;
  pagination = this.service.paginationMeta;
  errorMessage = this.service.error;

  searchControl = new FormControl("");
  searchQuery = signal<UsersQuery>({});

  private destroy$ = new Subject<void>();

  protected readonly handleImageError = handleImageError;
  protected readonly computeDiscountPrice = computeDiscountPrice;

  ngOnInit() {
    this.service.loadProducts();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // aspetta X ms prima di mandare la richiesta
        map((value) => (value ? value.trim() : "")), // prima di mandare la richista, al valore inserito viene prima fatto il tirm
        distinctUntilChanged(), // effettua una chiamata solo se il testo digitato è effettivamente cambiato
        takeUntil(this.destroy$), // per evitare memory leak quando si cambia pagina
      )
      .subscribe((searchTerm) => {
        this.searchQuery.update((sq) => ({ ...sq, searchTerm }));
        this.service.loadProducts(1, this.pagination()?.limit, this.searchQuery());
      });
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.service.loadProducts(event.page, event.limit, this.searchQuery());
  }

  toggleColumn(key: string) {
    this.visibleColumns.update((current) =>
      current.includes(key) ? current.filter((k) => k !== key) : [...current, key],
    );
  }

  onSortChange(event: { active: string; direction: string }) {
    this.searchQuery.update((sq) => ({
      ...sq,
      orderBy: event.active,
      orderDirection: event.direction,
    }));
    this.service.loadProducts(
      this.pagination()?.page,
      this.pagination()?.limit,
      this.searchQuery(),
    );
  }

  onCategorySelectChange(categoryId: number | null) {
    this.searchQuery.update((sq) => ({
      ...sq,
      categoryId: categoryId || undefined, // se è null, lo trasformo in undefined per evitare di mandare categoryId=null al backend
    }));
    this.service.loadProducts(
      this.pagination()?.page,
      this.pagination()?.limit,
      this.searchQuery(),
    );
  }
}
