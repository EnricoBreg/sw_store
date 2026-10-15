export default interface Category {
  id: number;
  name: string;
  description: string | null;
  products_count?: number; // presente nelle risposte admin: numero di prodotti (attivi e non)
}
