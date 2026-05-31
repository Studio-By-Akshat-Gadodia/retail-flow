import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { storesApi } from "@/features/stores/api/storesApi";
import { useStoreContext } from "@/features/stores/context/StoreContext";
import type {
  CreateStorePayload, AddMemberPayload, StoreRole,
} from "@/features/stores/types";

export function useCreateStore() {
  const { setCurrentStore, refetchStores } = useStoreContext();
  return useMutation({
    mutationFn: (payload: CreateStorePayload) => storesApi.create(payload),
    onSuccess: (store) => {
      refetchStores();
      setCurrentStore(store);
    },
  });
}

export function useUpdateStore(storeId: number) {
  const { refetchStores } = useStoreContext();
  return useMutation({
    mutationFn: (payload: Partial<CreateStorePayload>) => storesApi.update(storeId, payload),
    onSuccess: refetchStores,
  });
}

export function useMembers(storeId: number) {
  return useQuery({
    queryKey: ["stores", storeId, "members"],
    queryFn:  () => storesApi.listMembers(storeId),
    enabled:  !!storeId,
  });
}

export function useAddMember(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: AddMemberPayload) => storesApi.addMember(storeId, payload),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "members"] }),
  });
}

export function useUpdateMemberRole(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ userId, role }: { userId: number; role: Exclude<StoreRole, "owner"> }) =>
      storesApi.updateMemberRole(storeId, userId, role),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "members"] }),
  });
}

export function useRemoveMember(storeId: number) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (userId: number) => storesApi.removeMember(storeId, userId),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["stores", storeId, "members"] }),
  });
}
