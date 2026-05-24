import { OrderItem } from "./order-item";
import { User } from "./user";

export type OrderStatus = "pending" | "paid" | "shipped" | "delivered" | "cancelled" | "refunded";

export interface Order {
  id: number;
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