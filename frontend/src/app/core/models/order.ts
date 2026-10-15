import { OrderItem } from "./order-item";
import { User } from "./user";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

export const ORDER_STATUS_LABELS: Record<OrderStatus, string> = {
  pending: $localize`:@@order.status.pending:In attesa di pagamento`,
  paid: $localize`:@@order.status.paid:Pagato`,
  shipped: $localize`:@@order.status.shipped:Spedito`,
  delivered: $localize`:@@order.status.delivered:Consegnato`,
  cancelled: $localize`:@@order.status.cancelled:Annullato`,
  refunded: $localize`:@@order.status.refunded:Rimborsato`,
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