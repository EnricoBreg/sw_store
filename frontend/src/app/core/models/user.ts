export interface User {
  id: number | string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  number: string;
  admin: boolean;
  created_at: string;
  date_of_birth: string;
  orders_count: number;
  last_order_date: string;
  addresses_count: number;
}