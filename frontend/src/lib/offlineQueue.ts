const DB_NAME = 'rf_offline';
const DB_VERSION = 1;
const STORE = 'queue';

export type QueuedMethod = 'POST' | 'PATCH' | 'PUT' | 'DELETE';

export interface QueuedWrite {
  id?: number;
  method: QueuedMethod;
  path: string;
  body: unknown;
  createdAt: number;
  attempts: number;
  lastError?: string;
}

let dbPromise: Promise<IDBDatabase> | null = null;

function openDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise<IDBDatabase>((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB not available'));
      return;
    }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id', autoIncrement: true });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
  return dbPromise;
}

function reqToPromise<T>(req: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    req.onsuccess = () => resolve(req.result as T);
    req.onerror = () => reject(req.error);
  });
}

function txWith<T = void>(
  mode: IDBTransactionMode,
  work: (store: IDBObjectStore) => Promise<T> | T,
): Promise<T> {
  return openDb().then((db) => new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const store = tx.objectStore(STORE);
    let result: T;
    Promise.resolve(work(store))
      .then((r) => { result = r as T; })
      .catch(reject);
    tx.oncomplete = () => resolve(result as T);
    tx.onerror  = () => reject(tx.error);
    tx.onabort  = () => reject(tx.error);
  }));
}

export async function enqueue(
  item: Omit<QueuedWrite, 'id' | 'createdAt' | 'attempts'>,
): Promise<number> {
  const id = await txWith<number>('readwrite', (store) => {
    const row: Omit<QueuedWrite, 'id'> = { ...item, createdAt: Date.now(), attempts: 0 };
    return reqToPromise(store.add(row) as IDBRequest<number>);
  });
  emit();
  return id;
}

export async function listAll(): Promise<QueuedWrite[]> {
  try {
    return await txWith<QueuedWrite[]>('readonly', (store) =>
      reqToPromise(store.getAll() as IDBRequest<QueuedWrite[]>),
    );
  } catch {
    return [];
  }
}

export async function remove(id: number): Promise<void> {
  await txWith('readwrite', (store) => reqToPromise(store.delete(id)));
  emit();
}

export async function markFailed(id: number, error: string): Promise<void> {
  await txWith('readwrite', async (store) => {
    const existing = await reqToPromise(store.get(id) as IDBRequest<QueuedWrite | undefined>);
    if (!existing) return;
    existing.attempts += 1;
    existing.lastError = error;
    await reqToPromise(store.put(existing));
  });
  emit();
}

export async function clearAll(): Promise<void> {
  await txWith('readwrite', (store) => reqToPromise(store.clear()));
  emit();
}

export async function queueLength(): Promise<number> {
  const rows = await listAll();
  return rows.length;
}

const listeners = new Set<() => void>();

export function subscribeOfflineQueue(fn: () => void): () => void {
  listeners.add(fn);
  return () => { listeners.delete(fn); };
}

function emit() {
  for (const fn of listeners) {
    try { fn(); } catch { /* swallow */ }
  }
}
