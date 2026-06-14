import { useMutation, useQueryClient } from "@tanstack/react-query";
import { stockApi, type StockInPayload } from "@/features/inventory/api/stockApi";

export function useStockIn(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: StockInPayload) => stockApi.stockIn(payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["products", storeId] }),
  });
}
