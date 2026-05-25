import { Component, inject, OnInit } from "@angular/core";
import ViewPanel from "../../core/directives/view-panel/view-panel";
import { OrdersService } from "../../core/services/orders.service";
import { ErrorPanel } from "../../core/directives/error-panel";
import ApiPaginator from "../../components/api-paginator/api-paginator";
import OrderCard from "../../order-card/order-card";
import { RouterLink } from "@angular/router";

@Component({
  selector: "app-my-orders-page",
  imports: [ViewPanel, ErrorPanel, ApiPaginator, OrderCard, RouterLink],
  template: `
    <div class="mx-auto max-w-[1200px] py-6">
      <div appViewPanel>
        <h1 class="text-2xl font-semibold">I miei ordini</h1>
        <p class="text-gray-500">Di seguito, gli ordini da te effettuati nel nostro e-commerce.</p>

        @if (error(); as error) {
          <div
            appErrorPanel
          >
            <h4 class="text-lg font-semibold text-red-700 mb-3">{{ error.message }}</h4>
            <div class="space-y-2">
              @for (err of error.errors; track $index) {
                <p class="ml-2">{{ err }}</p>
              }
            </div>
          </div>
        }

        <div class="mt-4">
          @if (orders().length > 0) {
            <div class="flex flex-col md:flex-row gap-2 flex-wrap">
              @for (order of orders(); track order.id) {
                <app-order-card [order]="order" [routerLink]="[order.id]"/>

                <div class="mt-5">
                  <app-api-paginator
                    [meta]="pagination()"
                    (pageChangeEvent)="onPageChangeEvent($event)"
                  />
                </div>
              }
            </div>
          } @else {
            <div class="h-full">
              <h3 class="text-lg text-gray-600">Non hai ancora effettuato ordini🥺</h3>
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
  error = this.ordersService.error;

  ngOnInit(): void {
    this.ordersService.loadOrders();
  }

  onPageChangeEvent(event: { page: number; limit: number }) {
    this.ordersService.loadOrders(event.page, event.limit);
  }
}
