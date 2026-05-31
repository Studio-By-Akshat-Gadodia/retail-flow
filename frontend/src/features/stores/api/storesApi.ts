import { apiClient } from "@/lib/axios";
import type {
  Store,
  StoreMember,
  CreateStorePayload,
  AddMemberPayload,
  StoreRole,
} from "@/features/stores/types";

export const storesApi = {
  list: () =>
    apiClient.get<Store[]>("/stores/").then((r) => r.data as unknown as Store[]),

  create: (payload: CreateStorePayload) =>
    apiClient.post<Store>("/stores/", payload).then((r) => r.data as unknown as Store),

  update: (id: number, payload: Partial<CreateStorePayload>) =>
    apiClient.patch<Store>(`/stores/${id}/`, payload).then((r) => r.data as unknown as Store),

  listMembers: (storeId: number) =>
    apiClient
      .get<StoreMember[]>(`/stores/${storeId}/members/`)
      .then((r) => r.data as unknown as StoreMember[]),

  addMember: (storeId: number, payload: AddMemberPayload) =>
    apiClient
      .post<StoreMember>(`/stores/${storeId}/members/`, payload)
      .then((r) => r.data as unknown as StoreMember),

  updateMemberRole: (storeId: number, userId: number, role: Exclude<StoreRole, "owner">) =>
    apiClient
      .patch<StoreMember>(`/stores/${storeId}/members/${userId}/`, { role })
      .then((r) => r.data as unknown as StoreMember),

  removeMember: (storeId: number, userId: number) =>
    apiClient.delete(`/stores/${storeId}/members/${userId}/`),
};
