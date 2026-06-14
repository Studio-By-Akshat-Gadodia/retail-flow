import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { suppliersApi } from "@/features/suppliers/api/suppliersApi";
import type { CreateSupplierPayload, UpdateSupplierPayload } from "@/features/suppliers/types";

export function useSuppliers(storeId: number) {
  return useQuery({
    queryKey: ["suppliers", storeId],
    queryFn:  () => suppliersApi.list(storeId),
    enabled:  !!storeId,
  });
}

export function useCreateSupplier(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: CreateSupplierPayload) => suppliersApi.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["suppliers", storeId] }),
  });
}

export function useUpdateSupplier(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, ...payload }: { id: number } & UpdateSupplierPayload) =>
      suppliersApi.update(id, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["suppliers", storeId] }),
  });
}

export function useDeleteSupplier(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) => suppliersApi.remove(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ["suppliers", storeId] }),
  });
}
