import { useState, FormEvent } from "react";
import { useCreateProduct } from "@/features/products/hooks/useProducts";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";

interface Props {
  storeId:    number;
  onSuccess?: () => void;
}

export default function AddProductForm({ storeId, onSuccess }: Props) {
  const [name,         setName]         = useState("");
  const [sku,          setSku]          = useState("");
  const [category,     setCategory]     = useState("");
  const [quantity,     setQuantity]     = useState("0");
  const [unitPrice,    setUnitPrice]    = useState("");
  const [reorderLevel, setReorderLevel] = useState("0");

  const { mutate: createProduct, isPending, error } = useCreateProduct(storeId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    createProduct(
      {
        store_id:      storeId,
        name,
        sku,
        category,
        quantity:      parseInt(quantity, 10),
        unit_price:    unitPrice,
        reorder_level: parseInt(reorderLevel, 10),
      },
      { onSuccess }
    );
  }

  const errorMsg =
    error instanceof Error ? error.message : "Failed to add product. Please try again.";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. Wireless Keyboard"
        required
      />
      <Input
        label="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        placeholder="e.g. WK-001"
        required
      />
      <Input
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
        placeholder="e.g. Electronics"
        required
      />
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="Quantity"
          type="number"
          min="0"
          value={quantity}
          onChange={(e) => setQuantity(e.target.value)}
          required
        />
        <Input
          label="Unit price"
          type="number"
          min="0"
          step="0.01"
          value={unitPrice}
          onChange={(e) => setUnitPrice(e.target.value)}
          placeholder="0.00"
          required
        />
      </div>
      <Input
        label="Reorder level"
        type="number"
        min="0"
        value={reorderLevel}
        onChange={(e) => setReorderLevel(e.target.value)}
        hint="Alert when stock falls below this quantity"
        required
      />

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errorMsg}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        Add product
      </Button>
    </form>
  );
}
