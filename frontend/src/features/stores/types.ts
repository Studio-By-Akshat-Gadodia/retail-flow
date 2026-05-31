import type { AuthUser } from "@/features/auth/types";

export type StoreRole =
  | "owner"
  | "admin"
  | "manager"
  | "inventory_manager"
  | "cashier"
  | "viewer";

export const ROLE_LABELS: Record<StoreRole, string> = {
  owner:             "Owner",
  admin:             "Admin",
  manager:           "Manager",
  inventory_manager: "Inventory Manager",
  cashier:           "Cashier",
  viewer:            "Viewer",
};

export const ROLE_LEVEL: Record<StoreRole, number> = {
  owner:             50,
  admin:             40,
  manager:           30,
  inventory_manager: 20,
  cashier:           10,
  viewer:            0,
};

export const ASSIGNABLE_ROLES: StoreRole[] = [
  "admin",
  "manager",
  "inventory_manager",
  "cashier",
  "viewer",
];

export interface Store {
  id:           number;
  name:         string;
  slug:         string;
  description:  string;
  currency:     string;
  timezone:     string;
  is_active:    boolean;
  my_role:      StoreRole;
  member_count: number;
  created_by:   AuthUser;
  created_at:   string;
  updated_at:   string;
}

export interface StoreMember {
  id:         number;
  user:       AuthUser;
  role:       StoreRole;
  invited_by: AuthUser | null;
  joined_at:  string;
}

export interface CreateStorePayload {
  name:        string;
  description?: string;
  currency?:   string;
  timezone?:   string;
}

export interface AddMemberPayload {
  email: string;
  role:  Exclude<StoreRole, "owner">;
}
