import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/features/dashboard/api/dashboardApi";

export function useDashboardSummary(storeId: number) {
  return useQuery({
    queryKey: ["dashboard-summary", storeId],
    queryFn:  () => dashboardApi.summary(storeId),
    enabled:  !!storeId,
  });
}
