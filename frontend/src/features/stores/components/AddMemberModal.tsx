import { useState, FormEvent } from "react";
import Dialog from "@/shared/components/ui/Dialog";
import Input from "@/shared/components/ui/Input";
import Button from "@/shared/components/ui/Button";
import { useAddMember } from "@/features/stores/hooks/useStores";
import { ASSIGNABLE_ROLES, ROLE_LABELS, type StoreRole } from "@/features/stores/types";

interface Props {
  storeId:  number;
  open:     boolean;
  onClose:  () => void;
}

export default function AddMemberModal({ storeId, open, onClose }: Props) {
  const [email, setEmail] = useState("");
  const [role,  setRole]  = useState<Exclude<StoreRole, "owner">>("viewer");

  const { mutate: addMember, isPending, error, reset } = useAddMember(storeId);

  function handleClose() {
    setEmail(""); setRole("viewer"); reset(); onClose();
  }

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    addMember({ email, role }, { onSuccess: handleClose });
  }

  const errorMsg =
    error instanceof Error ? error.message : "Failed to add member.";

  return (
    <Dialog open={open} onClose={handleClose} title="Add team member">
      <form onSubmit={handleSubmit} className="space-y-4">
        <Input
          label="Email address"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="colleague@company.com"
          required
        />

        <div className="flex flex-col gap-1.5">
          <label className="text-sm font-medium text-fg">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as Exclude<StoreRole, "owner">)}
            className="h-9 w-full rounded-md border border-border bg-bg px-3 text-sm text-fg shadow-card hover:border-border-strong focus:outline-none focus:border-fg focus:ring-2 focus:ring-accent/20"
          >
            {ASSIGNABLE_ROLES.map((r) => (
              <option key={r} value={r}>{ROLE_LABELS[r]}</option>
            ))}
          </select>
          <p className="text-xs text-muted">
            {role === "admin" && "Can manage members and all store data."}
            {role === "manager" && "Can manage products, stock, suppliers and sales."}
            {role === "inventory_manager" && "Can manage stock levels and products only."}
            {role === "cashier" && "Can create sales transactions only."}
            {role === "viewer" && "Read-only access to all store data."}
          </p>
        </div>

        {error && (
          <p className="rounded-lg bg-danger-soft px-3 py-2 text-sm text-danger">{errorMsg}</p>
        )}

        <div className="flex gap-3 pt-1">
          <Button type="button" variant="secondary" onClick={handleClose} className="flex-1">
            Cancel
          </Button>
          <Button type="submit" loading={isPending} className="flex-1">
            Add member
          </Button>
        </div>
      </form>
    </Dialog>
  );
}
