import { useState, FormEvent } from "react";
import { useStockOut } from "@/features/inventory/hooks/useStock";
import type { Product } from "@/features/products/types";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";

interface Props {
  products:   Product[];
  storeId:    number;
  onSuccess?: () => void;
}

export default function StockOutForm({ products, storeId, onSuccess }: Props) {
  const [productId, setProductId] = useState<string>("");
  const [quantity,  setQuantity]  = useState("1");
  const [notes,     setNotes]     = useState("");

  const { mutate: stockOut, isPending, error } = useStockOut(storeId);

  const selected = products.find((p) => p.id === parseInt(productId, 10));

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    stockOut(
      {
        product_id: parseInt(productId, 10),
        quantity:   parseInt(quantity, 10),
        notes,
      },
      { onSuccess },
    );
  }

  const errorMsg =
    error instanceof Error ? error.message : "Failed to record stock out. Please try again.";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-fg">Product</label>
        <select
          value={productId}
          onChange={(e) => { setProductId(e.target.value); setQuantity("1"); }}
          required
          className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg shadow-card hover:border-border-strong focus:border-fg focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">Select a product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id} disabled={p.quantity === 0}>
              {p.name} — {p.sku} (available: {p.quantity})
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Quantity to remove"
        type="number"
        min="1"
        max={selected?.quantity ?? undefined}
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        hint={selected ? `Max ${selected.quantity} available` : undefined}
        required
      />

      <Input
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Sold to customer, damaged goods"
      />

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errorMsg}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        Record stock out
      </Button>
    </form>
  );
}
