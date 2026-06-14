import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { productsApi } from "@/features/products/api/productsApi";
import type { CreateProductPayload, UpdateProductPayload } from "@/features/products/types";

export function useProducts(storeId: number) {
  return useQuery({
    queryKey: ["products", storeId],
    queryFn:  () => productsApi.list(storeId),
    enabled:  !!storeId,
  });
}

export function useCreateProduct(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateProductPayload) => productsApi.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["products", storeId] }),
  });
}

export function useUpdateProduct(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateProductPayload) =>
      productsApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", storeId] }),
  });
}

export function useDeleteProduct(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => productsApi.remove(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", storeId] }),
  });
}
