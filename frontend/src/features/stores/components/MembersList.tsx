import { useState } from "react";
import { UserPlus, Trash2, ChevronDown } from "lucide-react";
import { useMembers, useUpdateMemberRole, useRemoveMember } from "@/features/stores/hooks/useStores";
import { useMe } from "@/features/auth/hooks/useAuth";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import {
  ROLE_LABELS, ROLE_LEVEL, ASSIGNABLE_ROLES,
  type StoreMember, type StoreRole,
} from "@/features/stores/types";
import Avatar from "@/shared/components/ui/Avatar";
import Badge from "@/shared/components/ui/Badge";
import Button from "@/shared/components/ui/Button";
import AddMemberModal from "@/features/stores/components/AddMemberModal";
import { cn } from "@/shared/utils/cn";
import type { BadgeTone } from "@/shared/components/ui/Badge";

const ROLE_TONE: Record<StoreRole, BadgeTone> = {
  owner:             "accent",
  admin:             "warning",
  manager:           "success",
  inventory_manager: "neutral",
  cashier:           "neutral",
  viewer:            "neutral",
};

function RoleSelect({
  member, myRole, storeId,
}: {
  member: StoreMember; myRole: StoreRole; storeId: number;
}) {
  const { mutate: updateRole, isPending } = useUpdateMemberRole(storeId);
  const myLevel   = ROLE_LEVEL[myRole];
  const canEdit   = myLevel >= ROLE_LEVEL.admin && member.role !== "owner" && myLevel > ROLE_LEVEL[member.role];

  if (!canEdit) {
    return <Badge tone={ROLE_TONE[member.role]}>{ROLE_LABELS[member.role]}</Badge>;
  }

  return (
    <div className="relative inline-flex items-center">
      <select
        value={member.role}
        disabled={isPending}
        onChange={(e) =>
          updateRole({ userId: member.user.id, role: e.target.value as Exclude<StoreRole, "owner"> })
        }
        className="h-6 appearance-none rounded-full bg-transparent pl-2 pr-6 text-[11px] font-medium focus:outline-none focus:ring-2 focus:ring-accent/30 disabled:opacity-50 cursor-pointer border border-border hover:border-border-strong"
      >
        {ASSIGNABLE_ROLES.filter((r) => ROLE_LEVEL[r] < myLevel).map((r) => (
          <option key={r} value={r}>{ROLE_LABELS[r]}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-1.5 h-3 w-3 text-muted" />
    </div>
  );
}

function MemberRow({
  member, myRole, myUserId, storeId,
}: {
  member: StoreMember; myRole: StoreRole; myUserId: number; storeId: number;
}) {
  const { mutate: remove, isPending } = useRemoveMember(storeId);
  const myLevel   = ROLE_LEVEL[myRole];
  const isSelf    = member.user.id === myUserId;
  const canRemove =
    member.role !== "owner" &&
    (isSelf || (myLevel >= ROLE_LEVEL.admin && myLevel > ROLE_LEVEL[member.role]));

  const fullName = `${member.user.first_name} ${member.user.last_name}`.trim();

  return (
    <div className="flex items-center gap-3 py-3">
      <Avatar name={fullName} size="md" />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-medium text-fg">
          {fullName || member.user.email}
          {isSelf && <span className="ml-1.5 text-xs text-muted">(you)</span>}
        </p>
        <p className="truncate text-xs text-muted">{member.user.email}</p>
      </div>
      <RoleSelect member={member} myRole={myRole} storeId={storeId} />
      {canRemove && (
        <button
          onClick={() => remove(member.user.id)}
          disabled={isPending}
          title="Remove member"
          className="ml-1 rounded-md p-1.5 text-muted hover:bg-danger-soft hover:text-danger transition-colors disabled:opacity-50"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );
}

export default function MembersList() {
  const { currentStore }  = useStoreContext();
  const { data: me }      = useMe();
  const [addOpen, setAddOpen] = useState(false);

  const { data: members = [], isLoading } = useMembers(currentStore?.id ?? 0);

  if (!currentStore || !me) return null;

  const myRole   = currentStore.my_role;
  const myLevel  = ROLE_LEVEL[myRole];
  const canAdd   = myLevel >= ROLE_LEVEL.admin;

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-fg">Team members</h3>
          <p className="text-xs text-muted mt-0.5">{members.length} member{members.length !== 1 ? "s" : ""}</p>
        </div>
        {canAdd && (
          <Button size="sm" variant="secondary" onClick={() => setAddOpen(true)}>
            <UserPlus className="h-3.5 w-3.5" />
            Add member
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 py-2">
              <div className="skeleton h-8 w-8 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <div className="skeleton h-3 w-32 rounded" />
                <div className="skeleton h-2.5 w-48 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-border">
          {members.map((m) => (
            <MemberRow
              key={m.id}
              member={m}
              myRole={myRole}
              myUserId={me.id}
              storeId={currentStore.id}
            />
          ))}
        </div>
      )}

      <AddMemberModal
        storeId={currentStore.id}
        open={addOpen}
        onClose={() => setAddOpen(false)}
      />
    </div>
  );
}
