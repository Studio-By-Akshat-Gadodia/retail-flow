import { apiClient } from "@/lib/axios";
import type { Product, CreateProductPayload } from "@/features/products/types";

export const productsApi = {
  list: (storeId: number) =>
    apiClient
      .get<Product[]>(`/products/?store_id=${storeId}`)
      .then((r) => r.data as unknown as Product[]),

  create: (payload: CreateProductPayload) =>
    apiClient
      .post<Product>("/products/", payload)
      .then((r) => r.data as unknown as Product),
};