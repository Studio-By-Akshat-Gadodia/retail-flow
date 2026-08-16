import { useMemo, useState } from "react";
import { Building2, Mail, Pencil, Phone, Plus, Search, Trash2, X } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useSuppliers, useDeleteSupplier } from "@/features/suppliers/hooks/useSuppliers";
import SupplierForm from "@/features/suppliers/components/SupplierForm";
import Button from "@/shared/components/ui/Button";
import { Card, CardBody } from "@/shared/components/ui/Card";
import Dialog from "@/shared/components/ui/Dialog";
import type { Supplier } from "@/features/suppliers/types";

export default function SuppliersPage() {
  const { currentStore } = useStoreContext();

  const [addOpen,           setAddOpen]           = useState(false);
  const [editingSupplier,   setEditingSupplier]   = useState<Supplier | null>(null);
  const [deletingSupplier,  setDeletingSupplier]  = useState<Supplier | null>(null);
  const [search,            setSearch]            = useState("");

  const { data: suppliers = [], isLoading } = useSuppliers(currentStore?.id ?? 0);
  const { mutate: deleteSupplier, isPending: isDeleting } = useDeleteSupplier(currentStore?.id ?? 0);

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    if (!term) return suppliers;
    return suppliers.filter(
      (s) =>
        s.name.toLowerCase().includes(term) ||
        s.contact_name.toLowerCase().includes(term) ||
        s.email.toLowerCase().includes(term),
    );
  }, [suppliers, search]);

  if (!currentStore) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-semibold text-fg">Suppliers</h1>
          <p className="mt-0.5 text-sm text-muted">
            {suppliers.length} supplier{suppliers.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4" />
          Add supplier
        </Button>
      </div>

      {/* Search */}
      {!isLoading && suppliers.length > 0 && (
        <div className="relative">
          <Search className="pointer-events-none absolute inset-y-0 left-3 my-auto h-4 w-4 text-muted" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, contact or email…"
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
      {!isLoading && suppliers.length === 0 && (
        <Card>
          <CardBody className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
              <Building2 className="h-6 w-6 text-accent" />
            </div>
            <h2 className="text-sm font-semibold text-fg">No suppliers yet</h2>
            <p className="mt-1 text-sm text-muted">
              Add your first supplier to keep track of who you reorder from.
            </p>
            <Button className="mt-6" onClick={() => setAddOpen(true)}>
              <Plus className="h-4 w-4" />
              Add your first supplier
            </Button>
          </CardBody>
        </Card>
      )}

      {/* No results from search */}
      {!isLoading && suppliers.length > 0 && filtered.length === 0 && (
        <Card>
          <CardBody className="py-10 text-center">
            <Search className="mx-auto mb-3 h-8 w-8 text-muted" />
            <h2 className="text-sm font-semibold text-fg">No suppliers found</h2>
            <p className="mt-1 text-sm text-muted">
              Nothing matches your search.{" "}
              <button onClick={() => setSearch("")} className="text-accent hover:underline">
                Clear search
              </button>
            </p>
          </CardBody>
        </Card>
      )}

      {/* Supplier list */}
      {!isLoading && filtered.length > 0 && (
        <div className="space-y-2">
          {filtered.map((s) => (
            <div
              key={s.id}
              className="flex items-center gap-4 rounded-lg border border-border bg-bg px-4 py-3 shadow-card"
            >
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-surface-2">
                <Building2 className="h-5 w-5 text-muted" />
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-fg">{s.name}</p>
                <p className="mt-0.5 truncate text-xs text-muted">
                  {s.contact_name || "—"}
                </p>
              </div>

              <div className="hidden shrink-0 items-center gap-4 sm:flex">
                {s.email && (
                  <a
                    href={`mailto:${s.email}`}
                    className="flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
                    title={s.email}
                  >
                    <Mail className="h-3.5 w-3.5" />
                    <span className="max-w-[120px] truncate">{s.email}</span>
                  </a>
                )}
                {s.phone && (
                  <a
                    href={`tel:${s.phone}`}
                    className="flex items-center gap-1 text-xs text-muted hover:text-fg transition-colors"
                  >
                    <Phone className="h-3.5 w-3.5" />
                    {s.phone}
                  </a>
                )}
              </div>

              <div className="flex shrink-0 items-center gap-1">
                <button
                  onClick={() => setEditingSupplier(s)}
                  className="rounded-md p-1.5 text-muted hover:bg-surface hover:text-fg transition-colors"
                  aria-label={`Edit ${s.name}`}
                >
                  <Pencil className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setDeletingSupplier(s)}
                  className="rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger transition-colors"
                  aria-label={`Delete ${s.name}`}
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add dialog */}
      <Dialog open={addOpen} onClose={() => setAddOpen(false)} title="Add a supplier">
        <SupplierForm storeId={currentStore.id} onSuccess={() => setAddOpen(false)} />
      </Dialog>

      {/* Edit dialog */}
      <Dialog
        open={!!editingSupplier}
        onClose={() => setEditingSupplier(null)}
        title="Edit supplier"
      >
        {editingSupplier && (
          <SupplierForm
            storeId={currentStore.id}
            supplier={editingSupplier}
            onSuccess={() => setEditingSupplier(null)}
          />
        )}
      </Dialog>

      {/* Delete confirmation */}
      <Dialog
        open={!!deletingSupplier}
        onClose={() => setDeletingSupplier(null)}
        title="Remove supplier"
      >
        {deletingSupplier && (
          <div className="space-y-4">
            <p className="text-sm text-muted">
              Are you sure you want to remove{" "}
              <span className="font-medium text-fg">{deletingSupplier.name}</span>? This action
              cannot be undone.
            </p>
            <div className="flex gap-3">
              <Button
                variant="secondary"
                className="flex-1"
                onClick={() => setDeletingSupplier(null)}
                disabled={isDeleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                className="flex-1"
                loading={isDeleting}
                onClick={() =>
                  deleteSupplier(deletingSupplier.id, {
                    onSuccess: () => setDeletingSupplier(null),
                  })
                }
              >
                Remove supplier
              </Button>
            </div>
          </div>
        )}
      </Dialog>
    </div>
  );
}
