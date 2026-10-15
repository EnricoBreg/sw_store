import Category from "./category";

export default interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  discount_percentage: number;
  stock_quantity: number;
  image_url: string | null;
  thumbnail_url?: string | null;
  active: boolean;
  category: Category;
}