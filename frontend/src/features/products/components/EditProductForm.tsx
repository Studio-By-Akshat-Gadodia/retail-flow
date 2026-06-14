import { useState, FormEvent } from "react";
import { useUpdateProduct } from "@/features/products/hooks/useProducts";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import type { Product } from "@/features/products/types";

interface Props {
  product:    Product;
  storeId:    number;
  onSuccess?: () => void;
}

export default function EditProductForm({ product, storeId, onSuccess }: Props) {
  const [name,         setName]         = useState(product.name);
  const [sku,          setSku]          = useState(product.sku);
  const [category,     setCategory]     = useState(product.category);
  const [quantity,     setQuantity]     = useState(String(product.quantity));
  const [unitPrice,    setUnitPrice]    = useState(product.unit_price);
  const [reorderLevel, setReorderLevel] = useState(String(product.reorder_level));

  const { mutate: updateProduct, isPending, error } = useUpdateProduct(storeId);

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    updateProduct(
      {
        id:            product.id,
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
    error instanceof Error ? error.message : "Failed to update product. Please try again.";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Product name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
      />
      <Input
        label="SKU"
        value={sku}
        onChange={(e) => setSku(e.target.value)}
        required
      />
      <Input
        label="Category"
        value={category}
        onChange={(e) => setCategory(e.target.value)}
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
        Save changes
      </Button>
    </form>
  );
}
