import { useEffect, type ReactNode } from "react";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { StoreProvider } from "@/features/stores/context/StoreContext";
import { ToastProvider, useToast } from "@/shared/components/ui/Toast";
import { OFFLINE_DRAINED_EVENT } from "@/lib/axios";

function OfflineDrainListener() {
  const toast = useToast();
  useEffect(() => {
    function onDrained(e: Event) {
      const detail = (e as CustomEvent<{ synced: number; remaining: number }>).detail;
      if (!detail || detail.synced === 0) return;
      queryClient.invalidateQueries();
      const word = detail.synced === 1 ? 'change' : 'changes';
      toast.success(
        detail.remaining > 0
          ? `Synced ${detail.synced} ${word} · ${detail.remaining} still pending`
          : `Synced ${detail.synced} offline ${word}`,
      );
    }
    window.addEventListener(OFFLINE_DRAINED_EVENT, onDrained);
    return () => window.removeEventListener(OFFLINE_DRAINED_EVENT, onDrained);
  }, [toast]);
  return null;
}

interface ProvidersProps {
  children: ReactNode;
}

export default function Providers({ children }: ProvidersProps) {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <StoreProvider>
          <OfflineDrainListener />
          {children}
        </StoreProvider>
      </ToastProvider>
    </QueryClientProvider>
  );
}
