export type ApiStatus = "success" | "failed";

export interface ApiResponse<T> {
  status: ApiStatus;
  data: T;
}

export interface PaginatedData<T> {
  total_count: number;
  total_pages: number;
  current_page: number;
  page_size: number;
  results: T[];
}

export interface ApiError {
  detail?: string;
  [key: string]: unknown;
}
