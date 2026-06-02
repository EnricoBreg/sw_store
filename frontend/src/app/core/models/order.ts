import { OrderItem } from "./order-item";
import { User } from "./user";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: "In attesa di pagamento",
  paid: "Pagato",
  shipped: "Spedito",
  delivered: "Consegnato",
  cancelled: "Annullato",
  refunded: "Rimborsato",
};

export interface Order {
  id: number;
  code: string;
  first_name: string;
  last_name: string;
  street: string;
  city: string;
  zip_code: string;
  country: string;
  total_amount: number;
  stripe_payment_token?: string;
  status: OrderStatus;
  created_at: string; // data formato ISO
  updated_at: string; // data formato ISO

  user: User;
  items: OrderItem[];
}