import { FormEvent, useState } from "react";
import { useCreateSupplier, useUpdateSupplier } from "@/features/suppliers/hooks/useSuppliers";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import type { Supplier } from "@/features/suppliers/types";

interface Props {
  storeId:    number;
  supplier?:  Supplier;
  onSuccess?: () => void;
}

export default function SupplierForm({ storeId, supplier, onSuccess }: Props) {
  const isEdit = !!supplier;

  const [name,        setName]        = useState(supplier?.name        ?? "");
  const [contactName, setContactName] = useState(supplier?.contact_name ?? "");
  const [email,       setEmail]       = useState(supplier?.email        ?? "");
  const [phone,       setPhone]       = useState(supplier?.phone        ?? "");
  const [notes,       setNotes]       = useState(supplier?.notes        ?? "");

  const createMutation = useCreateSupplier(storeId);
  const updateMutation = useUpdateSupplier(storeId);

  const mutation  = isEdit ? updateMutation : createMutation;
  const isPending = mutation.isPending;
  const error     = mutation.error;

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const payload = { name, contact_name: contactName, email, phone, notes };
    if (isEdit) {
      updateMutation.mutate({ id: supplier.id, ...payload }, { onSuccess });
    } else {
      createMutation.mutate({ store_id: storeId, ...payload }, { onSuccess });
    }
  }

  const errorMsg =
    error instanceof Error
      ? error.message
      : `Failed to ${isEdit ? "update" : "add"} supplier. Please try again.`;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <Input
        label="Supplier name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="e.g. ABC Wholesale"
        required
      />
      <Input
        label="Contact person"
        value={contactName}
        onChange={(e) => setContactName(e.target.value)}
        placeholder="e.g. Alice Smith"
      />
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Input
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="alice@supplier.com"
        />
        <Input
          label="Phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="+1 555 000 0000"
        />
      </div>
      <Input
        label="Notes"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Payment terms, lead time, etc."
      />

      {error && (
        <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errorMsg}</p>
      )}

      <Button type="submit" loading={isPending} className="w-full">
        {isEdit ? "Save changes" : "Add supplier"}
      </Button>
    </form>
  );
}
