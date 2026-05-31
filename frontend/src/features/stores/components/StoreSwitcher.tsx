import { useState, useRef, useEffect } from "react";
import { ChevronsUpDown, Check, Plus, Store } from "lucide-react";
import { cn } from "@/shared/utils/cn";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import Dialog from "@/shared/components/ui/Dialog";
import CreateStoreForm from "@/features/stores/components/CreateStoreForm";

export default function StoreSwitcher() {
  const { stores, currentStore, setCurrentStore } = useStoreContext();
  const [open,       setOpen]       = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div ref={ref} className="relative">
        <button
          onClick={() => setOpen((v) => !v)}
          className={cn(
            "flex w-full items-center gap-2 rounded-lg px-2 py-2 text-left transition-colors",
            "hover:bg-surface",
            open && "bg-surface"
          )}
        >
          <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg">
            <Store className="h-3.5 w-3.5" />
          </span>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-fg">
              {currentStore?.name ?? "Select a store"}
            </p>
            <p className="text-[11px] text-muted">
              {currentStore?.my_role?.replace("_", " ") ?? ""}
            </p>
          </div>
          <ChevronsUpDown className="h-3.5 w-3.5 shrink-0 text-muted" />
        </button>

        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 rounded-lg border border-border bg-bg py-1 shadow-pop animate-scale-in">
            {stores.length > 0 && (
              <>
                <p className="px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted">
                  Your stores
                </p>
                {stores.map((store) => (
                  <button
                    key={store.id}
                    onClick={() => { setCurrentStore(store); setOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors hover:bg-surface"
                  >
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-primary text-primary-fg text-[10px] font-bold">
                      {store.name[0].toUpperCase()}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-fg">{store.name}</span>
                    {currentStore?.id === store.id && (
                      <Check className="h-3.5 w-3.5 shrink-0 text-accent" />
                    )}
                  </button>
                ))}
                <div className="my-1 border-t border-border" />
              </>
            )}
            <button
              onClick={() => { setOpen(false); setCreateOpen(true); }}
              className="flex w-full items-center gap-2.5 px-3 py-2 text-sm text-muted transition-colors hover:bg-surface hover:text-fg"
            >
              <Plus className="h-4 w-4 shrink-0" />
              Create new store
            </button>
          </div>
        )}
      </div>

      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        title="Create a new store"
      >
        <CreateStoreForm onSuccess={() => setCreateOpen(false)} />
      </Dialog>
    </>
  );
}
