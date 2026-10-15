import { Order, OrderStatus } from "./order";
import Product from "./product";

/** Statistiche della home dell'area admin (GET /admin/dashboard). */
export interface AdminDashboard {
  orders_count: number;
  orders_by_status: Record<OrderStatus, number>;
  revenue: number; // somma degli ordini non annullati e non rimborsati
  products_count: number;
  active_products_count: number;
  users_count: number;
  low_stock_threshold: number;
  low_stock_products: Product[];
  latest_orders: Order[];
}
