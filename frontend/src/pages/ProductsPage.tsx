import { useState } from "react";
import { Package, Plus } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useProducts } from "@/features/products/hooks/useProducts";
import Button from "@/shared/components/ui/Button";
import { Card, CardBody } from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import Dialog from "@/shared/components/ui/Dialog";
import AddProductForm from "@/features/products/components/AddProductForm";

export default function ProductsPage() {
  const { currentStore } = useStoreContext();
  const [addOpen, setAddOpen] = useState(false);

  const { data: products = [], isLoading } = useProducts(currentStore?.id ?? 0);

  if (!currentStore) return null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Products</h1>
          <p className="mt-0.5 text-sm text-muted">
            {products.length} item{products.length !== 1 ? "s" : ""} in catalog
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add product
        </Button>
      </div>

      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {!isLoading && products.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
              <Package className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-fg">No products yet</h2>
            <p className="mt-1 text-sm text-muted">
              Add your first product to start building your catalog.
            </p>
            <Button className="mt-6" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first product
            </Button>
          </CardBody>
        </Card>
      )}

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
                <p className="text-sm font-semibold text-fg">
                  ${parseFloat(product.unit_price).toFixed(2)}
                </p>
                <p className="mt-0.5 text-xs text-muted">Qty: {product.quantity}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add a product">
        <AddProductForm storeId={currentStore.id} onSuccess={() => setAddOpen(false)} />
      </Dialog>
    </div>
  );
}
