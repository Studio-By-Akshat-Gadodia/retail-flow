import { useState, FormEvent } from "react";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import { useUpdateStore } from "@/features/stores/hooks/useStores";
import { ROLE_LEVEL } from "@/features/stores/types";
import MembersList from "@/features/stores/components/MembersList";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import { cn } from "@/shared/utils/cn";

type Tab = "general" | "members";

function GeneralTab() {
  const { currentStore, refetchStores } = useStoreContext();
  const [name,        setName]        = useState(currentStore?.name        ?? "");
  const [description, setDescription] = useState(currentStore?.description ?? "");
  const [currency,    setCurrency]    = useState(currentStore?.currency     ?? "USD");

  const { mutate: update, isPending, isSuccess, error } = useUpdateStore(currentStore?.id ?? 0);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    update({ name, description, currency }, { onSuccess: refetchStores });
  }

  const myLevel = ROLE_LEVEL[currentStore?.my_role ?? "viewer"];
  const canEdit = myLevel >= ROLE_LEVEL.admin;

  return (
    <form onSubmit={handleSubmit} className="max-w-sm space-y-4">
      <Input
        label="Store name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        disabled={!canEdit}
        required
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        disabled={!canEdit}
        placeholder="Short description (optional)"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-fg">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          disabled={!canEdit}
          className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg shadow-card hover:border-border-strong focus:outline-none focus:border-fg focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
        >
          <option value="USD">USD — US Dollar</option>
          <option value="EUR">EUR — Euro</option>
          <option value="GBP">GBP — British Pound</option>
          <option value="INR">INR — Indian Rupee</option>
          <option value="CAD">CAD — Canadian Dollar</option>
          <option value="AUD">AUD — Australian Dollar</option>
        </select>
      </div>

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">
          Failed to save changes.
        </p>
      )}
      {isSuccess && (
        <p className="rounded-lg bg-success-soft px-3 py-2 text-sm text-success">
          Changes saved.
        </p>
      )}

      {canEdit && (
        <Button type="submit" loading={isPending}>
          Save changes
        </Button>
      )}
    </form>
  );
}

export default function SettingsPage() {
  const [tab, setTab] = useState<Tab>("general");
  const { currentStore } = useStoreContext();

  const tabs: { id: Tab; label: string }[] = [
    { id: "general", label: "General" },
    { id: "members", label: "Members" },
  ];

  return (
    <div className="max-w-2xl">
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-fg">Settings</h1>
        <p className="mt-0.5 text-sm text-muted">{currentStore?.name}</p>
      </div>

      {/* Tab bar */}
      <div className="mb-6 flex gap-1 border-b border-border">
        {tabs.map(({ id, label }) => (
          <button
            key={id}
            onClick={() => setTab(id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors border-b-2 -mb-px",
              tab === id
                ? "border-fg text-fg"
                : "border-transparent text-muted hover:text-fg"
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "general" && <GeneralTab />}
      {tab === "members" && <MembersList />}
    </div>
  );
}
