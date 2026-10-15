import { map, OperatorFunction } from "rxjs";
import { ApiResponse } from "./api-types";
import { Cart, CartItem } from "./cart";
import { Order } from "./order";
import { OrderItem } from "./order-item";
import Product from "./product";
import { Wishlist } from "./wishlist";

/*
 * Il backend serializza i decimali (prezzi, sconti, totali) come stringhe, es. "89.91".
 * Queste funzioni li convertono in numeri una volta sola, nel layer HTTP, così il resto
 * dell'app lavora sempre con i tipi dei modelli.
 */

export function toNumber(value: unknown): number {
  const parsed = typeof value === "number" ? value : parseFloat(String(value ?? ""));
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeProduct(product: Product): Product {
  return {
    ...product,
    price: toNumber(product.price),
    discount_percentage: toNumber(product.discount_percentage),
  };
}

export function normalizeCartItem(item: CartItem): CartItem {
  return {
    ...item,
    unit_price: toNumber(item.unit_price),
    discount_percentage: toNumber(item.discount_percentage),
    discounted_unit_price: toNumber(item.discounted_unit_price),
    total_price: toNumber(item.total_price),
    product: normalizeProduct(item.product),
  };
}

export function normalizeCart(cart: Cart): Cart {
  return {
    ...cart,
    items_count: toNumber(cart.items_count),
    total_amount: toNumber(cart.total_amount),
    items: (cart.items ?? []).map(normalizeCartItem),
  };
}

export function normalizeWishlist(wishlist: Wishlist): Wishlist {
  return {
    ...wishlist,
    items: (wishlist.items ?? []).map((item) => ({ ...item, product: normalizeProduct(item.product) })),
  };
}

export function normalizeOrderItem(item: OrderItem): OrderItem {
  return {
    ...item,
    unit_price: toNumber(item.unit_price),
    discount_percentage: toNumber(item.discount_percentage),
    total_price: toNumber(item.total_price),
    product: item.product ? normalizeProduct(item.product) : item.product,
  };
}

export function normalizeOrder(order: Order): Order {
  return {
    ...order,
    total_amount: toNumber(order.total_amount),
    items: (order.items ?? []).map(normalizeOrderItem),
  };
}

/** Operatore RxJS: applica la normalizzazione al campo `data` di una ApiResponse. */
export function mapData<T>(normalize: (data: T) => T): OperatorFunction<ApiResponse<T>, ApiResponse<T>> {
  return map((response) => (response.data == null ? response : { ...response, data: normalize(response.data) }));
}

/** Come mapData, per le risposte che contengono una lista. */
export function mapListData<T>(normalize: (item: T) => T): OperatorFunction<ApiResponse<T[]>, ApiResponse<T[]>> {
  return mapData<T[]>((items) => items.map(normalize));
}
