export type SalesReportRow = {
  product_id:    number;
  product_name:  string;
  product_sku:   string;
  quantity_sold: number;
};

export type SalesReport = {
  date_from:           string;
  date_to:             string;
  total_quantity_sold: number;
  results:             SalesReportRow[];
};

export type TrendPoint = {
  date:      string; // "YYYY-MM-DD"
  stock_in:  number;
  stock_out: number;
};

export type StockTrend = {
  results: TrendPoint[];
};