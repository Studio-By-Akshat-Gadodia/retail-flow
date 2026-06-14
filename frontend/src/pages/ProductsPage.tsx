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
      {/* Header */}
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

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="skeleton h-14 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && products.length === 0 && (
        <Card>
          <CardBody className="py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft">
              <Package className="h-7 w-7 text-accent" />
            </div>
            <h2 className="text-base font-semibold text-fg">No products yet</h2>
            <p className="mt-1.5 text-sm text-muted max-w-xs mx-auto">
              Your catalog is empty. Add your first product to start tracking inventory.
            </p>
            <Button className="mt-6" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first product
            </Button>
          </CardBody>
        </Card>
      )}

      {/* Product table */}
      {!isLoading && products.length > 0 && (
        <Card>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left">
                  <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">
                    Name
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">
                    SKU
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">
                    Category
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide text-right">
                    Qty
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide text-right">
                    Reorder at
                  </th>
                  <th className="px-4 py-3 text-xs font-medium text-muted uppercase tracking-wide">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {products.map((product) => {
                  const isLow = product.quantity <= product.reorder_level;
                  return (
                    <tr
                      key={product.id}
                      className="hover:bg-surface transition-colors"
                    >
                      <td className="px-4 py-3 font-medium text-fg">
                        {product.name}
                      </td>
                      <td className="px-4 py-3 font-mono text-xs text-muted">
                        {product.sku}
                      </td>
                      <td className="px-4 py-3 text-muted">
                        {product.category}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-fg">
                        {product.quantity}
                      </td>
                      <td className="px-4 py-3 text-right tabular text-muted">
                        {product.reorder_level}
                      </td>
                      <td className="px-4 py-3">
                        {isLow ? (
                          <Badge tone="danger">Low stock</Badge>
                        ) : (
                          <Badge tone="success">In stock</Badge>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add a product">
        <AddProductForm storeId={currentStore.id} onSuccess={() => setAddOpen(false)} />
      </Dialog>
    </div>
  );
}
