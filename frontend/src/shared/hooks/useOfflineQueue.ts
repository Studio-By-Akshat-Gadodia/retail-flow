import { useEffect, useState } from 'react';
import { listAll, subscribeOfflineQueue, type QueuedWrite } from '@/lib/offlineQueue';

export function useOfflineQueue() {
  const [items, setItems] = useState<QueuedWrite[]>([]);

  useEffect(() => {
    let cancelled = false;
    const refresh = () => {
      listAll().then((rows) => { if (!cancelled) setItems(rows); }).catch(() => {});
    };
    refresh();
    const unsub = subscribeOfflineQueue(refresh);
    return () => { cancelled = true; unsub(); };
  }, []);

  return { items, count: items.length };
}
