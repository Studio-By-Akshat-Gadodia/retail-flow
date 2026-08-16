import { useQuery } from "@tanstack/react-query";
import { reportsApi, type SalesReportParams } from "@/features/reports/api/reportsApi";

export function useSalesReport(params: SalesReportParams | null) {
  return useQuery({
    queryKey: ["sales-report", params],
    queryFn:  () => reportsApi.getSalesReport(params!),
    enabled:  params !== null,
  });
}

export function useStockTrend(params: SalesReportParams | null) {
  return useQuery({
    queryKey: ["stock-trend", params],
    queryFn:  () => reportsApi.getStockTrend(params!),
    enabled:  params !== null,
  });
}
