import Product from "./product";

export interface OrderItem {
  id: number;
  order_id: number;
  unit_price: number;
  quantity: number;

  product: Product;
}