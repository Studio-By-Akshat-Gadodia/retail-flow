import {
  createContext, useContext, useState, useMemo,
  ReactNode, useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { storesApi } from "@/features/stores/api/storesApi";
import { useMe } from "@/features/auth/hooks/useAuth";
import { storage } from "@/lib/storage";
import type { Store } from "@/features/stores/types";

interface StoreContextValue {
  stores:           Store[];
  currentStore:     Store | null;
  setCurrentStore:  (store: Store) => void;
  isLoading:        boolean;
  refetchStores:    () => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const { isSuccess: isAuthenticated } = useMe();

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn:  storesApi.list,
    enabled:  isAuthenticated || !!storage.getAccessToken(),
    staleTime: 1000 * 60 * 5,
  });

  // Track the explicitly chosen store ID (seeded from localStorage).
  // currentStore is derived synchronously so RequireStore never sees a
  // false-negative null between isLoading flipping to false and an effect firing.
  const [chosenId, setChosenId] = useState<number | null>(
    () => storage.getCurrentStoreId()
  );

  const currentStore = useMemo<Store | null>(() => {
    if (stores.length === 0) return null;
    if (chosenId !== null) {
      const found = stores.find((s) => s.id === chosenId);
      if (found) return found;
    }
    return stores[0];
  }, [stores, chosenId]);

  const setCurrentStore = useCallback((store: Store) => {
    storage.setCurrentStoreId(store.id);
    setChosenId(store.id);
  }, []);

  const refetchStores = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ["stores"] });
  }, [queryClient]);

  return (
    <StoreContext.Provider
      value={{ stores, currentStore, setCurrentStore, isLoading, refetchStores }}
    >
      {children}
    </StoreContext.Provider>
  );
}

export function useStoreContext(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStoreContext must be used inside <StoreProvider>");
  return ctx;
}
