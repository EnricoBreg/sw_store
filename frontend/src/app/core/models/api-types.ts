export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data: T;
  meta?: PaginationMeta;
  errors?: string[];
}

export interface PaginationMeta {
  count: number;
  page: number;
  next: number;
  prev: number;
  next_url: string;
  prev_url: string;
}