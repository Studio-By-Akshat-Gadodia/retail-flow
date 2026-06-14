import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi, type StockInPayload, type StockOutPayload } from "@/features/inventory/api/stockApi";

export function useStockIn(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockInPayload) => stockApi.stockIn(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", storeId] }),
  });
}

export function useStockOut(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockOutPayload) => stockApi.stockOut(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", storeId] }),
  });
}
