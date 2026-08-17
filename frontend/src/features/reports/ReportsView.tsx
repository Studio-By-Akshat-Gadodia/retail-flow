import { useState } from "react";
import { BarChart3, Download, TrendingDown } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useSalesReport, useStockTrend } from "@/features/reports/hooks/useReportsQuery";
import { exportReportCsv } from "@/features/reports/utils/exportCsv";
import { SalesBarChart } from "@/features/reports/components/SalesBarChart";
import { MovementTrendChart } from "@/features/reports/components/MovementTrendChart";
import Button from "@/shared/components/ui/Button";
import Input from "@/shared/components/ui/Input";
import { Card, CardBody, StatCard } from "@/shared/components/ui/Card";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import { formatNumber } from "@/shared/utils/format";

function localIso(d: Date): string {
  const y  = d.getFullYear();
  const m  = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
}

function defaultDateFrom(): string {
  const d = new Date();
  d.setDate(1);
  return localIso(d);
}

function defaultDateTo(): string {
  return localIso(new Date());
}

export default function ReportsView() {
  const { currentStore } = useStoreContext();
  const [dateFrom, setDateFrom] = useState(defaultDateFrom);
  const [dateTo,   setDateTo]   = useState(defaultDateTo);

  // The native date inputs constrain the picker but not typed/pasted values, so
  // guard the inverted range here too — the API rejects it with a 400.
  const isRangeInverted = Boolean(dateFrom && dateTo && dateFrom > dateTo);

  const params =
    currentStore && dateFrom && dateTo && !isRangeInverted
      ? { store_id: currentStore.id, date_from: dateFrom, date_to: dateTo }
      : null;

  const reportQuery = useSalesReport(params);
  const trendQuery  = useStockTrend(params);

  const isLoading = reportQuery.isLoading || trendQuery.isLoading;
  const isError   = (reportQuery.isError  || trendQuery.isError) && !isLoading;
  const report    = reportQuery.data;
  const trend     = trendQuery.data;

  const hasData   = report && report.results.length > 0;

  if (!currentStore) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-xl font-semibold text-fg">Sales Report</h1>
          <p className="mt-0.5 text-sm text-muted">
            Units sold (stock-out) per product over a date range
          </p>
        </div>
        {hasData && (
          <Button variant="secondary" size="sm" onClick={() => exportReportCsv(report)}>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        )}
      </div>

      {/* Date range */}
      <Card>
        <CardBody>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end">
            <div className="flex-1">
              <Input
                label="From"
                type="date"
                value={dateFrom}
                max={dateTo || defaultDateTo()}
                error={isRangeInverted ? "From date must be on or before the To date." : undefined}
                onChange={(e) => setDateFrom(e.target.value)}
              />
            </div>
            <div className="flex-1">
              <Input
                label="To"
                type="date"
                value={dateTo}
                min={dateFrom}
                max={defaultDateTo()}
                onChange={(e) => setDateTo(e.target.value)}
              />
            </div>
          </div>
        </CardBody>
      </Card>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <div className="skeleton h-64 w-full rounded-lg" />
            <div className="skeleton h-64 w-full rounded-lg" />
          </div>
          <div className="skeleton h-20 w-full rounded-lg" />
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-12 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Error */}
      {isError && (
        <Card>
          <CardBody className="py-8 text-center">
            <p className="text-sm text-danger">Failed to load report. Please try again.</p>
          </CardBody>
        </Card>
      )}

      {/* Results */}
      {!isLoading && !isError && report && trend && (
        <div className="space-y-4">
          {/* Charts */}
          {(hasData || trend.results.length > 0) && (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {hasData && <SalesBarChart data={report.results} />}
              {trend.results.length > 0 && <MovementTrendChart data={trend.results} />}
            </div>
          )}

          {/* Stat */}
          <StatCard
            label="Total units sold"
            value={formatNumber(report.total_quantity_sold)}
            icon={<TrendingDown className="h-4 w-4" />}
          />

          {/* Table */}
          {!hasData ? (
            <EmptyState
              icon={BarChart3}
              title="No sales in this period"
              description="There were no stock-out movements in the selected date range."
            />
          ) : (
            <Card>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-surface">
                      <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted">
                        Product
                      </th>
                      <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-muted sm:table-cell">
                        SKU
                      </th>
                      <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-muted">
                        Qty Sold
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {report.results.map((row) => (
                      <tr key={row.product_id} className="transition-colors hover:bg-surface">
                        <td className="px-4 py-3 font-medium text-fg">{row.product_name}</td>
                        <td className="hidden px-4 py-3 text-muted sm:table-cell">{row.product_sku}</td>
                        <td className="px-4 py-3 text-right font-semibold tabular text-fg">
                          {formatNumber(row.quantity_sold)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t-2 border-border bg-surface">
                      <td className="px-4 py-3 font-semibold text-fg">Total</td>
                      <td className="hidden px-4 py-3 sm:table-cell" />
                      <td className="px-4 py-3 text-right font-semibold tabular text-fg">
                        {formatNumber(report.total_quantity_sold)}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
