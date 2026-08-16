import type { SalesReport } from "@/features/reports/types";

export function exportReportCsv(report: SalesReport): void {
  const rows = [
    ["Product Name", "SKU", "Quantity Sold"],
    ...report.results.map((r) => [r.product_name, r.product_sku, String(r.quantity_sold)]),
    ["Total", "", String(report.total_quantity_sold)],
  ];
  const csv  = rows.map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href     = url;
  a.download = `sales_report_${report.date_from}_${report.date_to}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
