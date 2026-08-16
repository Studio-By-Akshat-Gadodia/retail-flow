import { apiClient } from "@/lib/axios";
import type { Supplier, CreateSupplierPayload, UpdateSupplierPayload } from "@/features/suppliers/types";

export const suppliersApi = {
  list: (storeId: number) =>
    apiClient
      .get<Supplier[]>(`/suppliers/?store_id=${storeId}`)
      .then((r) => r.data as unknown as Supplier[]),

  create: (payload: CreateSupplierPayload) =>
    apiClient
      .post<Supplier>("/suppliers/", payload)
      .then((r) => r.data as unknown as Supplier),

  update: (id: number, payload: UpdateSupplierPayload) =>
    apiClient
      .patch<Supplier>(`/suppliers/${id}/`, payload)
      .then((r) => r.data as unknown as Supplier),

  remove: (id: number) => apiClient.delete(`/suppliers/${id}/`),
};
