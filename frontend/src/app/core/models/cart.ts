import Product from "./product";

export interface Cart {
  id: number;
  items: CartItem[];
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
}
