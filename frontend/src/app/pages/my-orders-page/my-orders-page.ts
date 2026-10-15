import { Component, computed, inject, OnInit, signal } from "@angular/core";
import { RouterLink } from "@angular/router";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatOption, MatSelect } from "@angular/material/select";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { OrdersService } from "../../core/services/orders.service";
import { ErrorPanel } from "../../core/directives/error-panel";
import ApiPaginator from "../../components/api-paginator/api-paginator";
import OrderCard from "../../order-card/order-card";
import { ORDER_STATUS_LABELS, OrderStatus } from "../../core/models/order";

export const DEFAULT_ORDERS_PAGE_SIZE = 10;

@Component({
  selector: "app-my-orders-page",
  imports: [ViewPanel, ErrorPanel, ApiPaginator, OrderCard, RouterLink, MatFormField, MatLabel, MatSelect, MatOption],
  template: `
    <div class="mx-auto max-w-[1200px] py-6">
      <div appViewPanel>
        <div class="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
          <div>
            <h1 i18n="@@myOrders.title" class="text-2xl font-semibold">I miei ordini</h1>
            <p i18n="@@myOrders.description" class="text-gray-600">
              Di seguito, gli ordini da te effettuati nel nostro e-commerce.
            </p>
          </div>

          <mat-form-field class="w-full md:max-w-xs" subscriptSizing="dynamic">
            <mat-label i18n="@@myOrders.statusFilter">Filtra per stato</mat-label>
            <mat-select
              multiple
              data-testid="orders-status-filter"
              [value]="selectedStatuses()"
              (selectionChange)="onStatusFilterChange($event.value)"
            >
              @for (option of statusOptions; track option.key) {
                <mat-option [value]="option.key">{{ option.label }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        @if (error(); as error) {
          <div appErrorPanel role="alert">
            <h2 class="text-lg font-semibold text-red-700 mb-3">{{ error.message }}</h2>
            @for (err of error.errors; track $index) {
              <p class="ml-2">{{ err }}</p>
            }
          </div>
        }

        <div class="mt-4">
          @if (orders().length > 0) {
            <ul class="flex flex-col md:flex-row gap-2 flex-wrap" data-testid="orders-list">
              @for (order of orders(); track order.id) {
                <li>
                  <a [routerLink]="[order.id]" class="block rounded-lg">
                    <app-order-card [order]="order" />
                  </a>
                </li>
              }
            </ul>

            <div class="mt-5">
              <app-api-paginator [meta]="pagination()" (pageChangeEvent)="onPageChangeEvent($event)" />
            </div>
          } @else if (loaded() && !error()) {
            <div class="h-full" role="status">
              @if (selectedStatuses().length) {
                <h2 i18n="@@myOrders.emptyFiltered" class="text-lg text-gray-600">
                  Nessun ordine con gli stati selezionati.
                </h2>
              } @else {
                <h2 i18n="@@myOrders.empty" class="text-lg text-gray-600">Non hai ancora effettuato ordini🥺</h2>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: ``,
})
export default class MyOrdersPage implements OnInit {
  private ordersService = inject(OrdersService);

  orders = this.ordersService.orders;
  pagination = this.ordersService.paginationMeta;
  error = this.ordersService.listError;
  loaded = this.ordersService.listLoaded;

  readonly statusOptions = (Object.entries(ORDER_STATUS_LABELS) as [OrderStatus, string][]).map(([key, label]) => ({
    key,
    label,
  }));
  readonly selectedStatuses = signal<OrderStatus[]>([]);
  private readonly pageSize = computed(() => this.pagination()?.limit ?? DEFAULT_ORDERS_PAGE_SIZE);

  ngOnInit(): void {
    this.ordersService.loadOrders(1, DEFAULT_ORDERS_PAGE_SIZE);
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.ordersService.loadOrders(event.page, event.limit, this.selectedStatuses());
  }

  /** Il filtro cambia l'insieme dei risultati: si riparte dalla prima pagina. */
  onStatusFilterChange(statuses: OrderStatus[]) {
    this.selectedStatuses.set(statuses);
    this.ordersService.loadOrders(1, this.pageSize(), statuses);
  }
}
