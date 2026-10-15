import Product from "./product";

export interface Cart {
  id: number;
  user_id: number;
  items: CartItem[];
  items_count: number; // numero di pezzi (somma delle quantità)
  total_amount: number; // totale calcolato dal backend: è l'importo che addebiterà POST /orders
}

export interface CartItem {
  id: number; // id della riga: si usa in PATCH/DELETE /cart/items/:id
  cart_id: number;
  product_id: number;
  quantity: number;
  unit_price: number; // prezzo di listino attuale (non scontato)
  discount_percentage: number;
  discounted_unit_price: number;
  total_price: number; // discounted_unit_price × quantity
  product: Product;
}
