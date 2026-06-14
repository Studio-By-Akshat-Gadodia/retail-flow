import { apiClient } from "@/lib/axios";
import type { SalesReport } from "@/features/reports/types";

export type SalesReportParams = {
  store_id:  number;
  date_from: string;
  date_to:   string;
};

export const reportsApi = {
  getSalesReport: (params: SalesReportParams) =>
    apiClient
      .get<SalesReport>("/stock/report/", { params })
      .then((r) => r.data as unknown as SalesReport),
};
