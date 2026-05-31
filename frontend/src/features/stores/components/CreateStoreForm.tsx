import { useState, FormEvent } from "react";
import { useCreateStore } from "@/features/stores/hooks/useStores";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";

interface Props {
  onSuccess?: () => void;
}

export default function CreateStoreForm({ onSuccess }: Props) {
  const [name,        setName]        = useState("");
  const [description, setDescription] = useState("");
  const [currency,    setCurrency]    = useState("USD");

  const { mutate: createStore, isPending, error } = useCreateStore();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createStore({ name, description, currency }, { onSuccess });
  }

  const errorMsg =
    error instanceof Error ? error.message : "Failed to create store. Please try again.";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Store name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="My Retail Store"
        required
      />
      <Input
        label="Description"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Short description (optional)"
      />
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium text-fg">Currency</label>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value)}
          className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg shadow-card hover:border-border-strong focus:outline-none focus:border-fg focus:ring-2 focus:ring-accent/20"
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
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errorMsg}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        Create store
      </Button>
    </form>
  );
}
