import { apiClient } from "@/lib/axios";
import type { Product, CreateProductPayload, UpdateProductPayload } from "@/features/products/types";

export const productsApi = {
  list: (storeId: number) =>
    apiClient
      .get<Product[]>(`/products/?store_id=${storeId}`)
      .then((r) => r.data as unknown as Product[]),

  create: (payload: CreateProductPayload) =>
    apiClient
      .post<Product>("/products/", payload)
      .then((r) => r.data as unknown as Product),

  update: (id: number, payload: UpdateProductPayload) =>
    apiClient
      .patch<Product>(`/products/${id}/`, payload)
      .then((r) => r.data as unknown as Product),

  remove: (id: number) => apiClient.delete(`/products/${id}/`),
};