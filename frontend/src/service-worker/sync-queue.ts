import { apiClient } from "@/lib/axios";

interface QueuedMutation {
  id: string;
  url: string;
  method: string;
  body: unknown;
  timestamp: number;
}

const QUEUE_KEY = "rf_sync_queue";

function load(): QueuedMutation[] {
  try {
    return JSON.parse(localStorage.getItem(QUEUE_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function save(queue: QueuedMutation[]): void {
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

export const syncQueue = {
  enqueue(mutation: Omit<QueuedMutation, "id" | "timestamp">): void {
    const queue = load();
    queue.push({
      ...mutation,
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      timestamp: Date.now(),
    });
    save(queue);
  },

  async flush(): Promise<void> {
    const queue = load();
    const failed: QueuedMutation[] = [];

    for (const item of queue) {
      try {
        await apiClient.request({ url: item.url, method: item.method, data: item.body });
      } catch {
        failed.push(item);
      }
    }

    save(failed);
  },

  size(): number {
    return load().length;
  },
};

window.addEventListener("online", () => {
  if (syncQueue.size() > 0) {
    syncQueue.flush();
  }
});
