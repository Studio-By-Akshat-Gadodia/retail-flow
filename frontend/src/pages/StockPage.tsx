import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, CheckCircle2, Package } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useProducts } from "@/features/products/hooks/useProducts";
import Button from "@/shared/components/ui/Button";
import { Card, CardBody } from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import Dialog from "@/shared/components/ui/Dialog";
import StockInForm from "@/features/inventory/components/StockInForm";
import StockOutForm from "@/features/inventory/components/StockOutForm";
import { cn } from "@/shared/utils/cn";

type StockView = "all" | "low";

export default function StockPage() {
  const { currentStore } = useStoreContext();
  const [stockInOpen,  setStockInOpen]  = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);
  const [view, setView] = useState<StockView>("all");

  const { data: products = [], isLoading } = useProducts(currentStore?.id ?? 0);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.is_low_stock),
    [products],
  );

  const displayed = view === "low" ? lowStockProducts : products;

  if (!currentStore) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Inventory</h1>
          <p className="mt-0.5 text-sm text-muted">
            {products.length} product{products.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" onClick={() => setStockOutOpen(true)}>
            <ArrowUpFromLine className="h-4 w-4" />
            Stock out
          </Button>
          <Button onClick={() => setStockInOpen(true)}>
            <ArrowDownToLine className="h-4 w-4" />
            Stock in
          </Button>
        </div>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && products.length > 0 && (
        <>
          {/* Low-stock alert banner */}
          {lowStockProducts.length > 0 ? (
            <button
              type="button"
              onClick={() => setView(v => v === "low" ? "all" : "low")}
              className="flex w-full items-center gap-3 rounded-xl border border-danger/30 bg-danger-soft px-4 py-3 text-left transition-colors hover:bg-danger/10"
            >
              <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
              <p className="flex-1 text-sm font-semibold text-danger">
                {lowStockProducts.length} product{lowStockProducts.length !== 1 ? "s" : ""} need restocking
              </p>
              <span className="text-xs font-medium text-danger underline underline-offset-2">
                {view === "low" ? "Show all" : "View only"}
              </span>
            </button>
          ) : (
            <div className="flex items-center gap-2 rounded-xl border border-success/30 bg-success-soft px-4 py-3">
              <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
              <p className="text-sm font-medium text-success">All products are above their reorder level</p>
            </div>
          )}

          {/* Filter toggle */}
          <div className="flex gap-1 rounded-lg border border-border bg-surface p-1 w-fit">
            {(["all", "low"] as StockView[]).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={cn(
                  "rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                  view === v
                    ? "bg-bg shadow-card text-fg"
                    : "text-muted hover:text-fg"
                )}
              >
                {v === "all"
                  ? `All (${products.length})`
                  : `Low stock (${lowStockProducts.length})`}
              </button>
            ))}
          </div>

          {/* Stock list */}
          {displayed.length === 0 ? (
            <Card>
              <CardBody className="py-10 text-center">
                <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-success" />
                <p className="text-sm font-semibold text-fg">No low-stock products</p>
                <p className="mt-1 text-sm text-muted">Every item is above its reorder level.</p>
              </CardBody>
            </Card>
          ) : (
            <div className="space-y-2">
              {displayed.map((product) => (
                <div
                  key={product.id}
                  className={cn(
                    "flex items-center gap-4 rounded-lg border bg-bg px-4 py-3 shadow-card",
                    product.is_low_stock ? "border-danger/30" : "border-border",
                  )}
                >
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                    <Package className="h-5 w-5 text-muted" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="truncate text-sm font-medium text-fg">{product.name}</p>
                      {product.is_low_stock && (
                        <Badge tone="danger">Low stock</Badge>
                      )}
                    </div>
                    <p className="mt-0.5 text-xs text-muted">
                      SKU: {product.sku} · {product.category}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className={cn(
                      "text-sm font-semibold",
                      product.is_low_stock ? "text-danger" : "text-fg",
                    )}>
                      {product.quantity}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {product.is_low_stock
                        ? `reorder at ${product.reorder_level}`
                        : "in stock"}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Empty catalog state */}
      {!isLoading && products.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
              <Package className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-fg">No products yet</h2>
            <p className="mt-1 text-sm text-muted">
              Add products to your catalog before recording stock.
            </p>
          </CardBody>
        </Card>
      )}

      {/* Stock-in dialog */}
      <Dialog
        open={stockInOpen}
        onClose={() => setStockInOpen(false)}
        title="Record stock in"
      >
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-accent-soft px-3 py-2">
          <ArrowDownToLine className="h-4 w-4 shrink-0 text-accent" />
          <p className="text-sm text-accent">The product's quantity will increase by the amount you enter.</p>
        </div>
        <StockInForm
          products={products}
          storeId={currentStore.id}
          onSuccess={() => setStockInOpen(false)}
        />
      </Dialog>

      {/* Stock-out dialog */}
      <Dialog
        open={stockOutOpen}
        onClose={() => setStockOutOpen(false)}
        title="Record stock out"
      >
        <div className="mb-4 flex items-center gap-2 rounded-lg bg-danger-soft px-3 py-2">
          <ArrowUpFromLine className="h-4 w-4 shrink-0 text-danger" />
          <p className="text-sm text-danger">The product's quantity will decrease. You cannot go below zero.</p>
        </div>
        <StockOutForm
          products={products}
          storeId={currentStore.id}
          onSuccess={() => setStockOutOpen(false)}
        />
      </Dialog>
    </div>
  );
}
