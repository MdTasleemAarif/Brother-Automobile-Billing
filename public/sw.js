const VERSION = "ba-billing-pwa-v1";

self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

// No caching is used because billing data and PDFs must always be fresh.
self.addEventListener("fetch", () => {});
