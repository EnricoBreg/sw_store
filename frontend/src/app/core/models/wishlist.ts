import Product from "./product";

export interface Wishlist {
  id: number;
  user_id: number;
  items: WishlistItem[];
}

export interface WishlistItem {
  id: number;
  product: Product;
}
