import { Component, computed, inject, OnInit } from "@angular/core";
import { CurrencyPipe } from "@angular/common";
import { RouterLink } from "@angular/router";
import { AdminDashboardService } from "../../../core/services/admin-dashboard.service";
import { ORDER_STATUS_LABELS, OrderStatus } from "../../../core/models/order";
import OrderStatusBadge from "../../../order-status-badge/order-status-badge";
import ISODateDisplayer from "../../../data-displayer/data-displayer";
import { ErrorPanel } from "../../../core/directives/error-panel";

@Component({
  selector: "app-dashboard-page",
  imports: [CurrencyPipe, RouterLink, OrderStatusBadge, ISODateDisplayer, ErrorPanel],
  template: `
    <h1 class="text-2xl font-semibold mb-4" i18n="@@adminDashboard.title">Dashboard</h1>

    @if (error(); as message) {
      <div appErrorPanel role="alert">{{ message }}</div>
    }

    @if (dashboard(); as d) {
      <!-- Contatori principali -->
      <section aria-labelledby="dashboard-summary" data-testid="dashboard-summary">
        <h2 id="dashboard-summary" class="sr-only" i18n="@@adminDashboard.summary">Riepilogo</h2>
        <dl class="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div class="rounded-xl border border-gray-200 bg-white p-4">
            <dt class="text-sm text-gray-600" i18n="@@adminDashboard.revenue">Fatturato</dt>
            <dd class="text-2xl font-bold" data-testid="dashboard-revenue">{{ d.revenue | currency: "EUR" }}</dd>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-4">
            <dt class="text-sm text-gray-600" i18n="@@adminDashboard.orders">Ordini</dt>
            <dd class="text-2xl font-bold" data-testid="dashboard-orders">{{ d.orders_count }}</dd>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-4">
            <dt class="text-sm text-gray-600" i18n="@@adminDashboard.products">Prodotti attivi / totali</dt>
            <dd class="text-2xl font-bold">{{ d.active_products_count }} / {{ d.products_count }}</dd>
          </div>
          <div class="rounded-xl border border-gray-200 bg-white p-4">
            <dt class="text-sm text-gray-600" i18n="@@adminDashboard.users">Utenti</dt>
            <dd class="text-2xl font-bold">{{ d.users_count }}</dd>
          </div>
        </dl>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <!-- Ordini per stato -->
        <section aria-labelledby="dashboard-by-status" class="rounded-xl border border-gray-200 bg-white p-4">
          <h2 id="dashboard-by-status" class="text-lg font-semibold mb-3" i18n="@@adminDashboard.byStatus">
            Ordini per stato
          </h2>
          <ul class="space-y-2">
            @for (row of ordersByStatus(); track row.status) {
              <li class="flex items-center gap-3">
                <span class="w-48 shrink-0"><app-order-status-badge [status]="row.status" /></span>
                <span class="h-3 rounded bg-blue-600" [style.width.%]="row.percent" aria-hidden="true"></span>
                <span class="font-medium">{{ row.count }}</span>
              </li>
            }
          </ul>
        </section>

        <!-- Prodotti con stock basso -->
        <section aria-labelledby="dashboard-low-stock" class="rounded-xl border border-gray-200 bg-white p-4">
          <h2 id="dashboard-low-stock" class="text-lg font-semibold mb-3" i18n="@@adminDashboard.lowStock">
            Stock basso (≤ {{ d.low_stock_threshold }} pezzi)
          </h2>
          @if (d.low_stock_products.length) {
            <table class="w-full text-sm">
              <thead class="text-left text-gray-600">
                <tr>
                  <th scope="col" class="py-1" i18n="@@adminDashboard.col.product">Prodotto</th>
                  <th scope="col" class="py-1 text-right" i18n="@@adminDashboard.col.stock">Stock</th>
                </tr>
              </thead>
              <tbody>
                @for (product of d.low_stock_products; track product.id) {
                  <tr class="border-t border-gray-100">
                    <td class="py-1">
                      <a class="underline" [routerLink]="['/admin/products', product.id]">{{ product.name }}</a>
                    </td>
                    <td class="py-1 text-right font-medium">{{ product.stock_quantity }}</td>
                  </tr>
                }
              </tbody>
            </table>
          } @else {
            <p class="text-gray-600" i18n="@@adminDashboard.lowStock.none">Nessun prodotto con stock basso.</p>
          }
        </section>
      </div>

      <!-- Ultimi ordini -->
      <section aria-labelledby="dashboard-latest" class="mt-6 rounded-xl border border-gray-200 bg-white p-4">
        <h2 id="dashboard-latest" class="text-lg font-semibold mb-3" i18n="@@adminDashboard.latest">Ultimi ordini</h2>
        @if (d.latest_orders.length) {
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="text-left text-gray-600">
                <tr>
                  <th scope="col" class="py-1" i18n="@@adminDashboard.col.code">Codice</th>
                  <th scope="col" class="py-1" i18n="@@adminDashboard.col.customer">Cliente</th>
                  <th scope="col" class="py-1" i18n="@@adminDashboard.col.date">Data</th>
                  <th scope="col" class="py-1" i18n="@@adminDashboard.col.status">Stato</th>
                  <th scope="col" class="py-1 text-right" i18n="@@adminDashboard.col.total">Totale</th>
                </tr>
              </thead>
              <tbody>
                @for (order of d.latest_orders; track order.id) {
                  <tr class="border-t border-gray-100">
                    <td class="py-2">
                      <a class="underline" [routerLink]="['/admin/orders', order.id]">{{ order.code }}</a>
                    </td>
                    <td class="py-2">{{ order.first_name }} {{ order.last_name }}</td>
                    <td class="py-2"><app-isodate-displayer [date]="order.created_at" /></td>
                    <td class="py-2"><app-order-status-badge [status]="order.status" /></td>
                    <td class="py-2 text-right font-medium">{{ order.total_amount | currency: "EUR" }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        } @else {
          <p class="text-gray-600" i18n="@@adminDashboard.latest.none">Nessun ordine.</p>
        }
      </section>
    } @else if (!error()) {
      <p role="status" class="text-gray-600" i18n="@@adminDashboard.loading">Caricamento della dashboard...</p>
    }
  `,
  styles: ``,
})
export default class DashboardPage implements OnInit {
  private readonly service = inject(AdminDashboardService);

  readonly dashboard = this.service.dashboard;
  readonly error = this.service.error;

  /** Righe "ordini per stato" con la percentuale sul totale, per la barra orizzontale. */
  readonly ordersByStatus = computed(() => {
    const d = this.dashboard();
    if (!d) return [];
    const max = Math.max(1, ...Object.values(d.orders_by_status));
    return (Object.keys(ORDER_STATUS_LABELS) as OrderStatus[]).map((status) => {
      const count = d.orders_by_status[status] ?? 0;
      return { status, count, percent: (count / max) * 100 };
    });
  });

  ngOnInit() {
    this.service.loadDashboard();
  }
}
