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
import { AdminOrdersService, OrdersQuery } from "../../../../core/services/admin-orders.service";

@Component({
  selector: "app-orders-page",
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
        <h1 class="font-bold text-2xl">Gestione degli ordini</h1>
        <p class="text-gray-500 text-sm">Numero di ordini totale: 10</p>
      </div>

      <!-- Ricerca prodotti -->
      <div>
        <p class="text-lg font-semibold mb-3">Filtri</p>
        <!-- Per data -->

      </div>

      <!-- Sezione delle azioni della table -->
      <section>
        <div class="mb-2 flex items-center justify-between">
          <!-- Menu selezione colonne visibili -->
          <div class="ml-auto">
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

        <table mat-table [dataSource]="orders()" matSort (matSortChange)="onSortChange($event)">
          <ng-container matColumnDef="id">
            <th mat-header-cell *matHeaderCellDef>ID</th>
            <td mat-cell *matCellDef="let order">{{ order.id }}</td>
          </ng-container>
          <ng-container matColumnDef="status">
            <th
              mat-header-cell
              *matHeaderCellDef
              mat-sort-header
              sortActionDescription="Ordina per stato"
            >
              Stato
            </th>
            <td mat-cell *matCellDef="let order">
              {{ order.status }}
            </td>
          </ng-container>
          <ng-container matColumnDef="created_at">
            <th
              mat-header-cell
              *matHeaderCellDef
              mat-sort-header
              sortActionDescription="Ordina per data di creazione"
            >
              Data creazione
            </th>
            <td mat-cell *matCellDef="let order">{{ order.created_at }}</td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
        </table>
        <app-api-paginator [meta]="pagination()" (pageChangeEvent)="onPageChangeEvent($event)" />
      </section>
    </div>
  `,
  styles: ``,
})
export default class OrdersPage {
  service = inject(AdminOrdersService);

  allColumns = [
    { key: "id", label: "ID" },
    { key: "status", label: "Stato" },
    { key: "created_at", label: "Data creazione" },
  ];
  visibleColumns = signal<string[]>([
    "id",
    "status",
    "created_at",
  ]);
  displayedColumns = computed(() =>
    this.allColumns.map((c) => c.key).filter((key) => this.visibleColumns().includes(key)),
  );

  orders = this.service.orders;
  pagination = this.service.paginationMeta;
  errorMessage = this.service.error;

  searchControl = new FormControl("");
  searchQuery = signal<OrdersQuery>({});

  private destroy$ = new Subject<void>();

  protected readonly handleImageError = handleImageError;
  protected readonly computeDiscountPrice = computeDiscountPrice;

  ngOnInit() {
    this.service.loadOrders();

    this.searchControl.valueChanges
      .pipe(
        debounceTime(500), // aspetta X ms prima di mandare la richiesta
        map((value) => (value ? value.trim() : "")), // prima di mandare la richista, al valore inserito viene prima fatto il tirm
        distinctUntilChanged(), // effettua una chiamata solo se il testo digitato è effettivamente cambiato
        takeUntil(this.destroy$), // per evitare memory leak quando si cambia pagina
      )
      .subscribe((searchTerm) => {
        this.searchQuery.update((sq) => ({ ...sq, searchTerm }));
        this.service.loadOrders(1, this.pagination()?.limit, this.searchQuery());
      });
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.service.loadOrders(event.page, event.limit, this.searchQuery());
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
    this.service.loadOrders(
      this.pagination()?.page,
      this.pagination()?.limit,
    );
  }

  onCategorySelectChange(categoryId: number | null) {
    this.searchQuery.update((sq) => ({
      ...sq,
      categoryId: categoryId || undefined, // se è null, lo trasformo in undefined per evitare di mandare categoryId=null al backend
    }));
    this.service.loadOrders(
      this.pagination()?.page,
      this.pagination()?.limit,
      this.searchQuery(),
    );
  }
}
