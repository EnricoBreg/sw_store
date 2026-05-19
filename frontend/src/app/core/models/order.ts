import { OrderItem } from "./order-item";
import { User } from "./user";

export interface Order {

  id: number;
  street: string;
  city: string;
  zip_code: string;
  country: string;
  total_amount: number;
  stripe_payment_token?: string;
  status: "pending" | "paid" | "shipped" | "delivered" | "cancelled";
  created_at: string; // ISO date string
  updated_at: string; // ISO date string

  user: User;
  items: OrderItem[];
}