import { useMemo, useState } from "react";
import { Package, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useProducts, useDeleteProduct } from "@/features/products/hooks/useProducts";
import Button from "@/shared/components/ui/Button";
import { Card, CardBody } from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import Dialog from "@/shared/components/ui/Dialog";
import AddProductForm from "@/features/products/components/AddProductForm";
import EditProductForm from "@/features/products/components/EditProductForm";
import type { Product } from "@/features/products/types";

export default function ProductsPage() {
  const { currentStore } = useStoreContext();
  const [addOpen, setAddOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");

  const { data: products = [], isLoading } = useProducts(currentStore?.id ?? 0);
  const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct(currentStore?.id ?? 0);

  const categories = useMemo(
    () => [...new Set(products.map((p) => p.category))].sort(),
    [products],
  );

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return products.filter((p) => {
      const matchesSearch =
        !term ||
        p.name.toLowerCase().includes(term) ||
        p.sku.toLowerCase().includes(term);
      const matchesCategory = !selectedCategory || p.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [products, search, selectedCategory]);

  const hasFilters = !!search || !!selectedCategory;

  function clearFilters() {
    setSearch("");
    setSelectedCategory("");
  }

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

      {/* Search + category filter */}
      {!isLoading && products.length > 0 && (
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or SKU…"
              className="h-9 w-full rounded-md border border-border bg-bg pl-9 pr-9 text-sm text-fg shadow-card placeholder:text-muted hover:border-border-strong focus:border-fg focus:outline-none focus:ring-2 focus:ring-accent/20"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute inset-y-0 right-2 my-auto flex h-5 w-5 items-center justify-center rounded text-muted hover:text-fg"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="h-9 rounded-md border border-border bg-bg px-3 text-sm text-fg shadow-card hover:border-border-strong focus:border-fg focus:outline-none focus:ring-2 focus:ring-accent/20 sm:w-48"
          >
            <option value="">All categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>

          {hasFilters && (
            <button
              onClick={clearFilters}
              className="text-sm text-muted hover:text-fg transition-colors whitespace-nowrap"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Loading skeletons */}
      {isLoading && (
        <div className="space-y-2">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="skeleton h-20 w-full rounded-lg" />
          ))}
        </div>
      )}

      {/* Empty catalog */}
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

      {/* No results from filter */}
      {!isLoading && products.length > 0 && filtered.length === 0 && (
        <Card>
          <CardBody className="py-10 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted" />
            <h2 className="text-sm font-semibold text-fg">No products found</h2>
            <p className="mt-1 text-sm text-muted">
              No products match your search. Try a different term or{" "}
              <button onClick={clearFilters} className="text-accent hover:underline">
                clear the filters
              </button>
              .
            </p>
          </CardBody>
        </Card>
      )}

      {/* Product list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((product) => (
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
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-sm font-semibold text-fg">
                    ${parseFloat(product.unit_price).toFixed(2)}
                  </p>
                  <p className="mt-0.5 text-xs text-muted">Qty: {product.quantity}</p>
                </div>
                <button
                  onClick={() => setEditingProduct(product)}
                  className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg transition-colors"
                  aria-label={`Edit ${product.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingProduct(product)}
                  className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger transition-colors"
                  aria-label={`Delete ${product.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add a product">
        <AddProductForm storeId={currentStore.id} onSuccess={() => setAddOpen(false)} />
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingProduct}
        onClose={() => setEditingProduct(null)}
        title="Edit product"
      >
        {editingProduct && (
          <EditProductForm
            product={editingProduct}
            storeId={currentStore.id}
            onSuccess={() => setEditingProduct(null)}
          />
        )}
      </Dialog>

      {/* Delete confirmation dialog */}
      <Dialog
        open={!!deletingProduct}
        onClose={() => setDeletingProduct(null)}
        title="Remove product"
      >
        {deletingProduct && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Are you sure you want to remove{" "}
              <span className="font-medium text-fg">{deletingProduct.name}</span>? It will
              disappear from the catalog and reports.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeletingProduct(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={isDeleting}
                onClick={() =>
                  deleteProduct(deletingProduct.id, {
                    onSuccess: () => setDeletingProduct(null),
                  })
                }
              >
                Remove product
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
