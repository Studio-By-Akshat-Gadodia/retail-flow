import { useState } from "react";
import { Store, Plus, ArrowRight } from "lucide-react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/config/routes";
import Button from "@/shared/components/ui/Button";
import { Card, CardBody } from "@/shared/components/ui/Card";
import Badge from "@/shared/components/ui/Badge";
import Dialog from "@/shared/components/ui/Dialog";
import CreateStoreForm from "@/features/stores/components/CreateStoreForm";
import { ROLE_LABELS } from "@/features/stores/types";
import type { BadgeTone } from "@/shared/components/ui/Badge";
import type { StoreRole } from "@/features/stores/types";

const ROLE_TONE: Record<StoreRole, BadgeTone> = {
  owner: "accent", admin: "warning", manager: "success",
  inventory_manager: "neutral", cashier: "neutral", viewer: "neutral",
};

export default function StoresPage() {
  const { stores, setCurrentStore, isLoading } = useStoreContext();
  const [createOpen, setCreateOpen] = useState(false);
  const navigate = useNavigate();

  function select(store: Parameters<typeof setCurrentStore>[0]) {
    setCurrentStore(store);
    navigate(ROUTES.DASHBOARD);
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-surface">
        <div className="skeleton h-8 w-48 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface px-4 py-12">
      <div className="w-full max-w-md">

        {/* Header */}
        <div className="mb-8 flex items-center gap-3">
          <img src="/icons/icon.svg" alt="RetailFlow" className="h-10 w-10 rounded-xl" />
          <div>
            <h1 className="text-lg font-semibold text-fg">RetailFlow</h1>
            <p className="text-sm text-muted">Choose a store to continue</p>
          </div>
        </div>

        {/* No stores */}
        {stores.length === 0 && (
          <Card>
            <CardBody className="py-10 text-center">
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-soft">
                <Store className="h-6 w-6 text-accent" />
              </div>
              <h2 className="text-sm font-semibold text-fg">No stores yet</h2>
              <p className="mt-1 text-sm text-muted">
                Create your first store to start managing your inventory.
              </p>
              <Button className="mt-6 w-full" onClick={() => setCreateOpen(true)}>
                <Plus className="h-4 w-4" />
                Create your first store
              </Button>
            </CardBody>
          </Card>
        )}

        {/* Store list */}
        {stores.length > 0 && (
          <div className="space-y-2">
            {stores.map((store) => (
              <button
                key={store.id}
                onClick={() => select(store)}
                className="group flex w-full items-center gap-4 rounded-xl border border-border bg-bg px-4 py-4 text-left shadow-card transition-all hover:border-border-strong hover:shadow-pop"
              >
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary text-primary-fg text-base font-bold">
                  {store.name[0].toUpperCase()}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-fg">{store.name}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <Badge tone={ROLE_TONE[store.my_role]}>{ROLE_LABELS[store.my_role]}</Badge>
                    <span className="text-xs text-muted">
                      {store.member_count} member{store.member_count !== 1 ? "s" : ""}
                    </span>
                  </div>
                </div>
                <ArrowRight className="h-4 w-4 shrink-0 text-muted transition-transform group-hover:translate-x-0.5" />
              </button>
            ))}

            <button
              onClick={() => setCreateOpen(true)}
              className="flex w-full items-center gap-3 rounded-xl border border-dashed border-border px-4 py-4 text-sm text-muted transition-colors hover:border-border-strong hover:text-fg"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create another store
            </button>
          </div>
        )}
      </div>

      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} title="Create a new store">
        <CreateStoreForm onSuccess={() => { setCreateOpen(false); navigate(ROUTES.DASHBOARD); }} />
      </Dialog>
    </div>
  );
}
