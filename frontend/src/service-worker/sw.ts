/// <reference lib="webworker" />
import { clientsClaim } from "workbox-core";
import { precacheAndRoute } from "workbox-precaching";
import { registerRoute } from "workbox-routing";
import { NetworkFirst, CacheFirst } from "workbox-strategies";
import { BackgroundSyncPlugin } from "workbox-background-sync";
import { CACHE_NAMES, SYNC_QUEUE_NAME } from "./strategies";

declare const self: ServiceWorkerGlobalScope;

clientsClaim();
self.skipWaiting();

// Injected by vite-plugin-pwa at build time
precacheAndRoute(self.__WB_MANIFEST);

// API: network-first, fall back to cache for reads
registerRoute(
  ({ url }) => url.pathname.startsWith("/api/"),
  new NetworkFirst({ cacheName: CACHE_NAMES.API })
);

// Static assets (images, icons): cache-first
registerRoute(
  ({ request }) =>
    request.destination === "image" || request.destination === "font",
  new CacheFirst({ cacheName: CACHE_NAMES.ASSETS })
);

// Offline fallback for navigation
registerRoute(
  ({ request }) => request.mode === "navigate",
  new NetworkFirst({
    cacheName: CACHE_NAMES.PAGES,
    networkTimeoutSeconds: 3,
    plugins: [
      {
        handlerDidError: async () => caches.match("/offline.html") ?? Response.error(),
      },
    ],
  })
);

// Background sync for queued stock mutations
const bgSyncPlugin = new BackgroundSyncPlugin(SYNC_QUEUE_NAME, {
  maxRetentionTime: 24 * 60,
});

registerRoute(
  ({ url, request }) =>
    url.pathname.startsWith("/api/") && request.method !== "GET",
  new NetworkFirst({
    cacheName: CACHE_NAMES.MUTATIONS,
    plugins: [bgSyncPlugin],
  }),
  "POST"
);
