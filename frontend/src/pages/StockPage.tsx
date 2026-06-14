import { useMemo, useState } from "react";
import { AlertTriangle, ArrowDownToLine, ArrowUpFromLine, Package } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useProducts } from "@/features/products/hooks/useProducts";
import Button from "@/shared/components/ui/Button";
import { Card, CardBody } from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import Dialog from "@/shared/components/ui/Dialog";
import StockInForm from "@/features/inventory/components/StockInForm";
import StockOutForm from "@/features/inventory/components/StockOutForm";

export default function StockPage() {
  const { currentStore } = useStoreContext();
  const [stockInOpen,  setStockInOpen]  = useState(false);
  const [stockOutOpen, setStockOutOpen] = useState(false);

  const { data: products = [], isLoading } = useProducts(currentStore?.id ?? 0);

  const lowStockProducts = useMemo(
    () => products.filter((p) => p.is_low_stock),
    [products],
  );

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

      {/* Low-stock summary panel */}
      {!isLoading && lowStockProducts.length > 0 && (
        <div className="rounded-xl border border-danger/30 bg-danger-soft p-4">
          <div className="mb-3 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 shrink-0 text-danger" />
            <p className="text-sm font-semibold text-danger">
              {lowStockProducts.length} product{lowStockProducts.length !== 1 ? "s" : ""} need restocking
            </p>
          </div>
          <div className="space-y-2">
            {lowStockProducts.map((product) => (
              <div key={product.id} className="flex items-center justify-between rounded-lg bg-bg px-3 py-2">
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-fg">{product.name}</p>
                  <p className="text-xs text-muted">SKU: {product.sku}</p>
                </div>
                <div className="ml-4 text-right shrink-0">
                  <p className="text-sm font-semibold text-danger">{product.quantity}</p>
                  <p className="text-xs text-muted">reorder at {product.reorder_level}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state */}
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

      {/* Stock list */}
      {!isLoading && products.length > 0 && (
        <div className="space-y-2">
          {products.map((product) => (
            <div
              key={product.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-bg px-4 py-3 shadow-card"
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
                <p className="text-sm font-semibold text-fg">{product.quantity}</p>
                <p className="mt-0.5 text-xs text-muted">in stock</p>
              </div>
            </div>
          ))}
        </div>
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
