import Product from "./product";

export interface Wishlist {
  id: number;
  user_id: number;
  items: WishlistItem[];
}

export interface WishlistItem {
  id: number;
  wishlist_id?: number;
  product: Product;
}
