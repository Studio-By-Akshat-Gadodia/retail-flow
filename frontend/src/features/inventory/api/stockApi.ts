import { apiClient } from "@/lib/axios";

export interface StockMovement {
  id:            number;
  product:       number;
  movement_type: string;
  quantity:      number;
  notes:         string;
  performed_by:  number | null;
  created_at:    string;
}

export interface StockInPayload {
  product_id: number;
  quantity:   number;
  notes?:     string;
}

export const stockApi = {
  stockIn: (payload: StockInPayload) =>
    apiClient
      .post<StockMovement>("/stock/in/", payload)
      .then((r) => r.data as unknown as StockMovement),
};
