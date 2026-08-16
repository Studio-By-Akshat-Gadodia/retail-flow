import { Link } from "react-router-dom";
import {
  ArrowDownToLine, ArrowUpFromLine, Package, AlertTriangle, XCircle, Wallet,
} from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useDashboardSummary } from "@/features/dashboard/hooks/useDashboard";
import { StatCard, Card, CardBody } from "@/shared/components/ui/Card";
import { Skeleton } from "@/shared/components/ui/Skeleton";
import { EmptyState } from "@/shared/components/ui/EmptyState";
import Badge from "@/shared/components/ui/Badge";
import { routes } from "@/config/routes";
import { formatMoney, formatNumber, formatDateTime } from "@/shared/utils/format";

export default function OverviewPage() {
  const { currentStore } = useStoreContext();
  const { data, isLoading } = useDashboardSummary(currentStore?.id ?? 0);

  if (!currentStore) return null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-fg">Overview</h1>
        <p className="mt-0.5 text-sm text-muted">{currentStore.name}</p>
      </div>

      {isLoading && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      )}

      {!isLoading && data && (
        <>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              label="Inventory value"
              value={formatMoney(Number(data.total_inventory_value), currentStore.currency)}
              icon={<Wallet className="h-4 w-4" />}
            />
            <StatCard
              label="Products"
              value={formatNumber(data.total_products)}
              icon={<Package className="h-4 w-4" />}
            />
            <StatCard
              label="Low stock"
              value={formatNumber(data.low_stock_count)}
              change={data.low_stock_count > 0 ? "Needs restocking" : undefined}
              positive={false}
              icon={<AlertTriangle className="h-4 w-4" />}
            />
            <StatCard
              label="Out of stock"
              value={formatNumber(data.out_of_stock_count)}
              change={data.out_of_stock_count > 0 ? "Zero units left" : undefined}
              positive={false}
              icon={<XCircle className="h-4 w-4" />}
            />
          </div>

          {data.low_stock_count > 0 && (
            <Link
              to={routes.stock}
              className="flex items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 transition-colors hover:bg-danger/10"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
              <p className="flex-1 text-sm font-semibold text-danger">
                {data.low_stock_count} product{data.low_stock_count !== 1 ? "s" : ""} need restocking
              </p>
              <span className="text-xs font-medium text-danger underline underline-offset-2">
                View inventory
              </span>
            </Link>
          )}

          <Card>
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold text-fg">Recent activity</h2>
            </div>
            {data.recent_activity.length === 0 ? (
              <CardBody>
                <EmptyState
                  icon={Package}
                  title="No stock activity yet"
                  description="Stock in/out movements will show up here."
                />
              </CardBody>
            ) : (
              <div className="divide-y divide-border">
                {data.recent_activity.map((activity) => {
                  const isStockIn = activity.movement_type === "stock_in";
                  return (
                    <div key={activity.id} className="flex items-center gap-3 px-4 py-3">
                      <div
                        className={
                          "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg " +
                          (isStockIn ? "bg-success-soft text-success" : "bg-danger-soft text-danger")
                        }
                      >
                        {isStockIn
                          ? <ArrowDownToLine className="h-4 w-4" />
                          : <ArrowUpFromLine className="h-4 w-4" />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-fg">{activity.product_name}</p>
                        <p className="mt-0.5 text-xs text-muted">
                          SKU: {activity.product_sku} · {formatDateTime(activity.created_at)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-fg tabular">
                          {isStockIn ? "+" : "-"}{activity.quantity}
                        </p>
                        <Badge tone={isStockIn ? "success" : "danger"} className="mt-0.5">
                          {isStockIn ? "Stock in" : "Stock out"}
                        </Badge>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </>
      )}
    </div>
  );
}
