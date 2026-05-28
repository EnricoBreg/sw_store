import { Component, computed, inject, signal } from "@angular/core";
import { MatTableModule } from "@angular/material/table";
import ApiPaginator from "../../../../components/api-paginator/api-paginator";
import { MatInput, MatFormField, MatLabel } from "@angular/material/input";
import { FormBuilder, ReactiveFormsModule } from "@angular/forms";
import { debounceTime, distinctUntilChanged, map, max, Subject, takeUntil } from "rxjs";
import { MatIcon } from "@angular/material/icon";
import { MatIconButton, MatAnchor } from "@angular/material/button";
import { MatMenuItem, MatMenuModule, MatMenuTrigger } from "@angular/material/menu";
import { MatCheckbox } from "@angular/material/checkbox";
import { MatSort, MatSortModule, MatSortHeader } from "@angular/material/sort";
import { CurrencyPipe } from "@angular/common";
import { computeDiscountPrice, handleImageError } from "../../../../core/utils";
import { RouterLink } from "@angular/router";
import { AdminOrdersService, OrdersQuery } from "../../../../core/services/admin-orders.service";
import { MatDatepickerModule } from "@angular/material/datepicker";
import { MatInputModule } from "@angular/material/input";
import { MatFormFieldModule } from "@angular/material/form-field";
import { provideNativeDateAdapter, MatOption } from '@angular/material/core';
import { MatSelect } from "@angular/material/select";
import { ORDER_STATUS_LABELS, OrderStatus } from "../../../../core/models/order";
import OrderStatusBadge from "../../../../order-status-badge/order-status-badge";

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
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatSelect,
    MatOption,
    OrderStatusBadge,
  ],
  providers: [provideNativeDateAdapter()],
  template: `
    <div class="space-y-4">
      <div>
        <h1 class="font-bold text-2xl">Gestione degli ordini</h1>
        <p class="text-gray-500 text-sm">Numero di ordini presenti: {{ pagination()?.count }}</p>
      </div>

      <div>
        <!-- Ricerca degli ordini -->
        <section [formGroup]="filterForm" class="md:w-4/5 space-y-4 mb-6">
          <p class="text-lg font-semibold mb-3">Filtri</p>

          <div class="flex items-center gap-6">
            <mat-form-field>
              <mat-label>Ricerca</mat-label>
              <input
                matInput
                formControlName="searchTerm"
                placeholder="Es. Mario Rossi o ID ordine"
              />
              <mat-hint>Ricerca per utente o ID ordine</mat-hint>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Stato ordine</mat-label>
              <mat-select formControlName="status">
                <mat-option [value]="null">Tutti gli stati</mat-option>
                @for (option of statusOptions; track option.key) {
                  <mat-option [value]="option.key">
                    <app-order-status-badge [status]="option.key"></app-order-status-badge>
                  </mat-option>
                }
              </mat-select>
            </mat-form-field>
          </div>

          <div class="flex items-center gap-1">
            <mat-form-field>
              <mat-label>Da data</mat-label>
              <input
                matInput
                [matDatepicker]="fromDatePicker"
                formControlName="fromDate"
                placeholder="MM/DD/YYYY"
              />
              <mat-hint>Ordini da data</mat-hint>
              <mat-datepicker-toggle matIconSuffix [for]="fromDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #fromDatePicker></mat-datepicker>
            </mat-form-field>
            <mat-form-field>
              <mat-label>A data</mat-label>
              <input
                matInput
                [matDatepicker]="toDatePicker"
                formControlName="toDate"
                placeholder="MM/DD/YYYY"
              />
              <mat-hint>Ordini fino a data</mat-hint>
              <mat-datepicker-toggle matIconSuffix [for]="toDatePicker"></mat-datepicker-toggle>
              <mat-datepicker #toDatePicker></mat-datepicker>
            </mat-form-field>
          </div>

          <div class="flex items-center gap-1">
            <mat-form-field>
              <mat-label>Importo totale minimo</mat-label>
              <input
                matInput
                type="number"
                formControlName="minTotalAmount"
                placeholder="Es. 99,99"
                step="0.01"
              />
              <span matSuffix class="text-lg font-medium px-4">€</span>
              <mat-hint>Ordini con importo totale minimo</mat-hint>
            </mat-form-field>

            <mat-form-field>
              <mat-label>Importo totale massimo</mat-label>
              <input
                matInput
                type="number"
                formControlName="maxTotalAmount"
                placeholder="Es. 999,99"
                step="0.01"
              />
              <span matSuffix class="text-lg font-medium px-4">€</span>
              <mat-hint>Ordini con importo totale massimo</mat-hint>
            </mat-form-field>
          </div>

          <button matButton="text" (click)="resetFilters()">
            <mat-icon>clear_all</mat-icon>
            Reset filtri
          </button>
        </section>

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

          <div class="w-full overflow-x-auto border border-gray-200 rounded-t-lg shadow-sm">
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
                  <app-order-status-badge [status]="order.status"></app-order-status-badge>
                </td>
              </ng-container>
              <ng-container matColumnDef="total_amount">
                <th
                  mat-header-cell
                  *matHeaderCellDef
                  mat-sort-header
                  sortActionDescription="Ordina per importo totale"
                >
                  Importo
                </th>
                <td mat-cell *matCellDef="let order">
                  {{ order.total_amount | currency: "EUR" }}
                </td>
              </ng-container>
              <ng-container matColumnDef="number_of_items">
                <th mat-header-cell *matHeaderCellDef>Numero di articoli</th>
                <td mat-cell *matCellDef="let order">
                  {{ order.items.length }}
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
              <ng-container matColumnDef="user">
                <th mat-header-cell *matHeaderCellDef>Utente</th>
                <td mat-cell *matCellDef="let order">
                  {{ order.user.first_name }} {{ order.user.last_name }}
                </td>
              </ng-container>
              <ng-container matColumnDef="user_email">
                <th mat-header-cell *matHeaderCellDef>Utente (email)</th>
                <td mat-cell *matCellDef="let order">
                  {{ order.user.email }}
                </td>
              </ng-container>
              <ng-container matColumnDef="actions">
                <th mat-header-cell *matHeaderCellDef>Azioni</th>
                <td mat-cell *matCellDef="let order">
                  <div class="flex items-center gap-1">
                    <a matIconButton [routerLink]="[order.id]">
                      <mat-icon>visibility</mat-icon>
                    </a>
                    <a matIconButton [routerLink]="[order.id, 'edit']">
                      <mat-icon>edit</mat-icon>
                    </a>
                  </div>
                </td>
              </ng-container>
              <tr mat-header-row *matHeaderRowDef="displayedColumns()"></tr>
              <tr mat-row *matRowDef="let row; columns: displayedColumns()"></tr>
            </table>
          </div>
          <div class="w-full overflow-x-auto border border-gray-200 rounded-b-lg shadow-sm">
            <app-api-paginator
              [meta]="pagination()"
              (pageChangeEvent)="onPageChangeEvent($event)"
            />
          </div>
        </section>
      </div>
    </div>
  `,
  styles: ``,
})
export default class OrdersPage {
  service = inject(AdminOrdersService);
  private fb = inject(FormBuilder);

  filterForm = this.fb.group({
    fromDate: [null as Date | null],
    toDate: [null as Date | null],
    searchTerm: [null as string | null],
    status: [null as string | null],
    minTotalAmount: [null as number | null],
    maxTotalAmount: [null as number | null],
  });
  searchQuery = signal<OrdersQuery>({});
  private destroy$ = new Subject<void>();

  allColumns = [
    { key: "id", label: "ID" },
    { key: "status", label: "Stato" },
    { key: "total_amount", label: "Importo totale" },
    { key: "number_of_items", label: "Numero di articoli" },
    { key: "created_at", label: "Data creazione" },
    { key: "user", label: "Utente" },
    { key: "user_email", label: "Utente (email)" },
    { key: "actions", label: "Azioni" },
  ];
  visibleColumns = signal<string[]>([
    "id",
    "status",
    "total_amount",
    "number_of_items",
    "created_at",
    "user_email",
    "actions",
  ]);
  displayedColumns = computed(() =>
    this.allColumns.map((c) => c.key).filter((key) => this.visibleColumns().includes(key)),
  );

  orders = this.service.orders;
  pagination = this.service.paginationMeta;
  errorMessage = this.service.error;

  protected readonly handleImageError = handleImageError;
  protected readonly computeDiscountPrice = computeDiscountPrice;
  protected readonly orderStatusLabels = ORDER_STATUS_LABELS;
  protected readonly statusOptions = Object.entries(ORDER_STATUS_LABELS).map(([key, label]) => ({
    key: key as OrderStatus,
    label,
  }));

  ngOnInit() {
    this.service.loadOrders();

    this.filterForm.valueChanges
      .pipe(
        map((formValue) => ({ ...formValue, searchTerm: formValue.searchTerm?.trim() || null })),
        debounceTime(1000), // aspetta X ms prima di mandare la richiesta
        distinctUntilChanged((prev, curr) => JSON.stringify(prev) === JSON.stringify(curr)), // effettua una chiamata solo se il testo digitato è effettivamente cambiato
        takeUntil(this.destroy$), // per evitare memory leak quando si cambia pagina
      )
      .subscribe((formValue) => {
        const searchQuery: OrdersQuery = {
          fromDate: formValue.fromDate || undefined, // se è null, lo trasformo in undefined per evitare di mandare fromDate=null al backend
          toDate: formValue.toDate || undefined, // se è null, lo trasformo in undefined per evitare di mandare toDate=null al backend
          status: formValue.status || undefined, // se è null, lo trasformo in undefined per evitare di mandare status=null al backend
          searchTerm: formValue.searchTerm || undefined, // se è null, lo trasformo in undefined per evitare di mandare searchTerm=null al backend
          minTotalAmount: formValue.minTotalAmount || undefined, // se è null, lo trasformo in undefined per evitare di mandare minTotalAmount=null al backend
          maxTotalAmount: formValue.maxTotalAmount || undefined, // se è null, lo trasformo in undefined per evitare di mandare maxTotalAmount=null al backend
        };

        this.searchQuery.set(searchQuery);

        // Quando i filtri vengono cambiati, ricarico la lista degli ordini dalla pagina 1
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
    this.service.loadOrders(this.pagination()?.page, this.pagination()?.limit, this.searchQuery());
  }

  resetFilters() {
    this.filterForm.reset();
    this.searchQuery.set({});
    this.service.loadOrders(1, this.pagination()?.limit);
  }
}
