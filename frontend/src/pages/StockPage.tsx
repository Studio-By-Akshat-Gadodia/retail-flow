import { useState } from "react";
import { ArrowDownToLine, Package, Plus } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useProducts } from "@/features/products/hooks/useProducts";
import Button from "@/shared/components/ui/Button";
import { Card, CardBody } from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import Dialog from "@/shared/components/ui/Dialog";
import StockInForm from "@/features/inventory/components/StockInForm";

export default function StockPage() {
  const { currentStore } = useStoreContext();
  const [stockInOpen, setStockInOpen] = useState(false);

  const { data: products = [], isLoading } = useProducts(currentStore?.id ?? 0);

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
        <Button onClick={() => setStockInOpen(true)}>
          <Plus className="h-4 w-4" />
          Record stock in
        </Button>
      </div>

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-16 w-full rounded-lg" />
          ))}
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
                  {product.quantity <= product.reorder_level && (
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
    </div>
  );
}
