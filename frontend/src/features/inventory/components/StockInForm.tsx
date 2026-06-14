import { useState, FormEvent } from "react";
import { useStockIn } from "@/features/inventory/hooks/useStock";
import type { Product } from "@/features/products/types";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";

interface Props {
  products:   Product[];
  storeId:    number;
  onSuccess?: () => void;
}

export default function StockInForm({ products, storeId, onSuccess }: Props) {
  const [productId, setProductId] = useState<string>("");
  const [quantity,  setQuantity]  = useState("1");
  const [notes,     setNotes]     = useState("");

  const { mutate: stockIn, isPending, error } = useStockIn(storeId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    stockIn(
      {
        product_id: parseInt(productId, 10),
        quantity:   parseInt(quantity, 10),
        notes,
      },
      { onSuccess },
    );
  }

  const errorMsg =
    error instanceof Error ? error.message : "Failed to record stock. Please try again.";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="space-y-1.5">
        <label className="text-sm font-medium text-fg">Product</label>
        <select
          value={productId}
          onChange={(e) => setProductId(e.target.value)}
          required
          className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg shadow-card hover:border-border-strong focus:border-fg focus:outline-none focus:ring-2 focus:ring-accent/20"
        >
          <option value="">Select a product…</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name} — {p.sku} (current: {p.quantity})
            </option>
          ))}
        </select>
      </div>

      <Input
        label="Quantity to add"
        type="number"
        min="1"
        value={quantity}
        onChange={(e) => setQuantity(e.target.value)}
        required
      />

      <Input
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="e.g. Delivery from supplier"
      />

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errorMsg}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        Record stock in
      </Button>
    </form>
  );
}
