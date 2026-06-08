import { useEffect, useState } from 'react';
import { CloudUpload, WifiOff } from 'lucide-react';
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus';
import { useOfflineQueue } from '@/shared/hooks/useOfflineQueue';
import { drainOfflineQueue } from '@/lib/axios';

export function OfflineBanner() {
  const { isOnline } = useNetworkStatus();
  const { count } = useOfflineQueue();
  const [draining, setDraining] = useState(false);

  useEffect(() => {
    if (!isOnline || count === 0 || draining) return;
    setDraining(true);
    drainOfflineQueue().finally(() => setDraining(false));
  }, [isOnline, count]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!isOnline) {
    return (
      <div
        role="status"
        aria-live="polite"
        className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-amber-300/60 bg-amber-400/95 px-4 py-1.5 text-xs font-semibold text-amber-950 backdrop-blur"
      >
        <WifiOff size={12} />
        You're offline — changes are queued
        {count > 0 && <span className="rounded-full bg-amber-950/15 px-1.5 py-0.5 text-[10px]">{count}</span>}
        {count > 0 && <span className="font-normal">and will sync on reconnect</span>}
      </div>
    );
  }

  if (count === 0) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed inset-x-0 top-0 z-[60] flex items-center justify-center gap-2 border-b border-blue-300/60 bg-blue-500/95 px-4 py-1.5 text-xs font-semibold text-white backdrop-blur"
    >
      <CloudUpload size={12} className={draining ? 'animate-pulse' : ''} />
      {draining ? 'Syncing' : 'Pending sync'}
      <span className="rounded-full bg-white/20 px-1.5 py-0.5 text-[10px]">{count}</span>
      {!draining && (
        <button
          type="button"
          onClick={() => { setDraining(true); drainOfflineQueue().finally(() => setDraining(false)); }}
          className="ml-1 rounded-md border border-white/30 px-2 py-0.5 text-[11px] font-medium hover:bg-white/10"
        >
          Sync now
        </button>
      )}
    </div>
  );
}
