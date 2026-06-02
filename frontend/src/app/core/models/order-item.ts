import Product from "./product";

export interface OrderItem {
  id: number;
  order_id: number;
  unit_price: number;
  quantity: number;
  discount_percentage: number;
  total_price: number;

  product: Product;
}