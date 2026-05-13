import { AfterViewInit, Component, computed, inject, signal, ViewChild } from "@angular/core";
import { MatPaginator, MatPaginatorModule } from "@angular/material/paginator";
import { MatTable, MatTableDataSource, MatTableModule } from "@angular/material/table";
import { User } from "../../../../core/models/user";
import { UsersQuery, UsersService } from "../../../../core/services/users.service";
import ApiPaginator from "../../../../components/api-paginator/api-paginator";
import { MatInput, MatFormField, MatLabel, MatHint } from "@angular/material/input";
import { FormControl, ReactiveFormsModule, ɵInternalFormsSharedModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, Subject, takeUntil } from "rxjs";
import { MatIcon } from "@angular/material/icon";
import { MatAnchor, MatIconButton } from "@angular/material/button";
import { MatMenuModule } from "@angular/material/menu";
import { MatCheckbox } from "@angular/material/checkbox";
import {MatSort, Sort, MatSortModule, MatSortHeader} from '@angular/material/sort';
import { ProductsService } from "../../../../core/services/products.service";
import { CurrencyPipe } from "@angular/common";
import { handleImageError } from "../../../../core/utils";

@Component({
  selector: "app-products-page",
  imports: [MatTableModule,
    ApiPaginator,
    MatInput,
    ReactiveFormsModule,
    MatFormField,
    MatLabel,
    MatIcon,
    MatHint,
    MatMenuModule,
    MatCheckbox,
    MatIconButton,
    MatSortHeader,
    MatSortModule,
    MatSort,
    CurrencyPipe
  ],
  template: `
    <div class="space-y-4">
      <div>
        <h1 class="font-bold text-2xl">I prodotti dello store</h1>
      </div>

      <!-- Serach bar -->
      <div>
        <mat-form-field>
          <mat-label>Ricerca un prodotto</mat-label>
          <input matInput type="text" placeholder="Es. Tavolo da lavoro" [formControl]="searchControl" />
        </mat-form-field>
      </div>

      <!-- Menu selezione colonne visibili -->
      <div>
        <div class="flex items-center justify-end">
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

        <table mat-table [dataSource]="products()" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="product_image">
            <th mat-header-cell *matHeaderCellDef></th>
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
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let product">{{ product.id }}</td>
          </ng-container>
          <ng-container matColumnDef="name">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per nome">Nome</th>
            <td mat-cell *matCellDef="let product">{{ product.name }}</td>
          </ng-container>
          <ng-container matColumnDef="description">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per descrizione">Descrizione</th>
            <td mat-cell *matCellDef="let product">{{ product.description }}</td>
          </ng-container>
          <ng-container matColumnDef="price">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per prezzo">Prezzo</th>
            <td mat-cell *matCellDef="let product">{{ product.price | currency:"EUR" }}</td>
          </ng-container>
          <ng-container matColumnDef="discount_percentage">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per sconto">Sconto</th>
            <td mat-cell *matCellDef="let product">{{ product.discount_percentage }}%</td>
          </ng-container>
          <ng-container matColumnDef="stock_quantity">
            <th mat-header-cell *matHeaderCellDef mat-sort-header sortActionDescription="Ordina per quantità">Stock</th>
            <td mat-cell *matCellDef="let product">{{ product.stock_quantity }}</td>
          </ng-container>
          <ng-container matColumnDef="category_name">
            <th mat-header-cell *matHeaderCellDef>Categoria</th>
            <td mat-cell *matCellDef="let product">{{ product.category.name }}</td>
          </ng-container>
          
          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
        </table>
        <app-api-paginator [meta]="pagination()" (pageChangeEvent)="onPageChangeEvent($event)" />
      </div>
    </div>
  `,
  styles: ``,
})
export default class ProductsPage {
  service = inject(ProductsService);

  allColumns = [
    { key: "product_image", label: "Anteprima" },
    { key: "id", label: "ID" },
    { key: "name", label: "Nome" },
    { key: "description", label: "Descrizione" },
    { key: "price", label: "Prezzo" },
    { key: "discount_percentage", label: "Sconto" },
    { key: "stock_quantity", label: "Stock" },
    { key: "category_name", label: "Categoria" },
  ];
  visibleColumns = signal<string[]>(["product_image", "id", "name", "price", "discount_percentage", "category_name"]);
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

  onSortChange(event: { active: string, direction: string }) {
    this.searchQuery.update(sq => ({ ...sq, orderBy: event.active, orderDirection: event.direction }))
    this.service.loadProducts(this.pagination()?.page, this.pagination()?.limit, this.searchQuery())
  }
}
