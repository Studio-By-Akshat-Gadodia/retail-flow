import {
  createContext, useContext, useState, useEffect,
  ReactNode, useCallback,
} from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { storesApi } from "@/features/stores/api/storesApi";
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

  const { data: stores = [], isLoading } = useQuery<Store[]>({
    queryKey: ["stores"],
    queryFn:  storesApi.list,
    enabled:  !!storage.getAccessToken(),
    staleTime: 1000 * 60 * 5,
  });

  const [currentStore, setCurrentStoreState] = useState<Store | null>(null);

  // Restore last-used store when the store list loads
  useEffect(() => {
    if (stores.length === 0) return;
    const savedId = storage.getCurrentStoreId();
    const match   = stores.find((s) => s.id === savedId);
    setCurrentStoreState(match ?? stores[0]);
  }, [stores]);

  const setCurrentStore = useCallback((store: Store) => {
    storage.setCurrentStoreId(store.id);
    setCurrentStoreState(store);
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
