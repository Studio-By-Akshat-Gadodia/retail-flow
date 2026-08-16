import { apiClient } from "@/lib/axios";

export interface RecentActivity {
  id:            number;
  product:       number;
  product_name:  string;
  product_sku:   string;
  movement_type: "stock_in" | "stock_out";
  quantity:      number;
  notes:         string;
  created_at:    string;
}

export interface DashboardSummary {
  total_products:         number;
  total_inventory_value:  string;
  low_stock_count:        number;
  out_of_stock_count:     number;
  recent_activity:        RecentActivity[];
}

export const dashboardApi = {
  summary: (storeId: number) =>
    apiClient
      .get<DashboardSummary>(`/dashboard/summary/?store_id=${storeId}`)
      .then((r) => r.data as unknown as DashboardSummary),
};
