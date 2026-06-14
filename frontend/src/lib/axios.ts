import axios, { AxiosError, InternalAxiosRequestConfig } from "axios";
import { env } from "@/config/env";
import { storage } from "@/lib/storage";
import type { ApiResponse } from "@/shared/types/api";
import {
  enqueue as enqueueOfflineWrite,
  listAll as listOfflineWrites,
  markFailed as markOfflineWriteFailed,
  remove as removeOfflineWrite,
  type QueuedMethod,
} from "@/lib/offlineQueue";

const BASE_URL = `${env.API_URL}/api/${env.API_VERSION}`;

const MUTATING_METHODS = new Set<QueuedMethod>(['POST', 'PATCH', 'PUT', 'DELETE']);

export const OFFLINE_DRAINED_EVENT = 'rf:offline-drained';

export const apiClient = axios.create({
  baseURL: BASE_URL,
  headers: { "Content-Type": "application/json" },
});

// Attach access token to every request
apiClient.interceptors.request.use((config: InternalAxiosRequestConfig) => {
  const token = storage.getAccessToken();
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

let refreshPromise: Promise<string> | null = null;

async function refreshAccessToken(): Promise<string> {
  const refresh = storage.getRefreshToken();
  if (!refresh) throw new Error("No refresh token.");

  const response = await axios.post<ApiResponse<{ access: string }>>(
    `${BASE_URL}/users/token/refresh/`,
    { refresh }
  );

  if (response.data.status !== "success") {
    throw new Error("Token refresh failed.");
  }

  const { access } = response.data.data;
  storage.setAccessToken(access);
  return access;
}

apiClient.interceptors.response.use(
  (response) => {
    const data = response.data as ApiResponse<unknown>;
    if (data.status === "failed") {
      return Promise.reject(Object.assign(new Error("API error"), { data: data.data }));
    }
    response.data = data.data;
    return response;
  },
  async (error: AxiosError) => {
    const original = error.config as InternalAxiosRequestConfig & { _retry?: boolean; _queued?: boolean };

    // Queue mutating requests on network error (no response from server)
    if (!error.response && !original?._queued) {
      const method = (original?.method ?? 'GET').toUpperCase();
      if (
        MUTATING_METHODS.has(method as QueuedMethod) &&
        !(original?.data instanceof FormData) &&
        original?.url
      ) {
        let body: unknown = null;
        try {
          body = typeof original.data === 'string' ? JSON.parse(original.data) : original.data;
        } catch {
          body = original.data;
        }
        await enqueueOfflineWrite({ method: method as QueuedMethod, path: original.url, body }).catch(() => {});
        // Return a synthetic empty success so React Query mutations don't blow up
        return Promise.resolve({ data: undefined, status: 202, statusText: 'Queued', headers: {}, config: original });
      }
    }

    if (error.response?.status === 401 && !original?._retry) {
      if (original) original._retry = true;

      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null;
      });

      try {
        const access = await refreshPromise;
        if (original) original.headers.Authorization = `Bearer ${access}`;
        return apiClient(original!);
      } catch {
        storage.clearTokens();
        window.location.href = "/login";
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

// -------------------------------------------------------------------------- //
//  Offline drain
// -------------------------------------------------------------------------- //

let draining = false;

export async function drainOfflineQueue(): Promise<{ synced: number; remaining: number }> {
  if (draining) return { synced: 0, remaining: (await listOfflineWrites()).length };
  draining = true;
  let synced = 0;
  try {
    const items = (await listOfflineWrites()).sort((a, b) => a.createdAt - b.createdAt);
    for (const item of items) {
      if (typeof navigator !== 'undefined' && !navigator.onLine) break;
      try {
        const config: InternalAxiosRequestConfig & { _queued?: boolean } = {
          method: item.method,
          url: item.path,
          ...(item.body != null ? { data: item.body } : {}),
          _queued: true,
          headers: {} as InternalAxiosRequestConfig['headers'],
        };
        await apiClient.request(config);
        if (item.id != null) await removeOfflineWrite(item.id);
        synced += 1;
      } catch (e) {
        const message = e instanceof Error ? e.message : String(e);
        if (item.id != null) await markOfflineWriteFailed(item.id, message);
        break;
      }
    }
  } finally {
    draining = false;
  }
  const remaining = (await listOfflineWrites()).length;
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(OFFLINE_DRAINED_EVENT, { detail: { synced, remaining } }));
  }
  return { synced, remaining };
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => { drainOfflineQueue().catch(() => {}); });
  if (navigator.onLine !== false) {
    queueMicrotask(() => { drainOfflineQueue().catch(() => {}); });
  }
}
