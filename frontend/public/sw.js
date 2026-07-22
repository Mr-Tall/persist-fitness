const STATIC_CACHE = "persist-static-v1";
const WORKOUT_CACHE = "persist-active-workout-v1";
const OFFLINE_WORKOUT_FALLBACK = "/offline-workout.html";

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.add(OFFLINE_WORKOUT_FALLBACK)),
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(self.clients.claim());
});

self.addEventListener("message", (event) => {
  if (event.data?.type === "CACHE_ACTIVE_WORKOUT" && event.data.url) {
    event.waitUntil(
      fetch(event.data.url, { credentials: "include" }).then(async (response) => {
        if (!response.ok) return;
        const cache = await caches.open(WORKOUT_CACHE);
        const scopeKey = new URL("/__persist_offline_workout_user__", self.location.origin);
        const existingScope = await cache.match(scopeKey);
        if (existingScope && (await existingScope.text()) !== event.data.userScope) {
          await caches.delete(WORKOUT_CACHE);
        }
        const scopedCache = await caches.open(WORKOUT_CACHE);
        await scopedCache.put(scopeKey, new Response(event.data.userScope ?? ""));
        await scopedCache.put(event.data.url, response);
      }),
    );
  }
  if (event.data?.type === "REMOVE_ACTIVE_WORKOUT" && event.data.url) {
    event.waitUntil(caches.open(WORKOUT_CACHE).then((cache) => cache.delete(event.data.url)));
  }
  if (event.data?.type === "CLEAR_OFFLINE_WORKOUTS") {
    event.waitUntil(caches.delete(WORKOUT_CACHE));
  }
  if (event.data?.type === "PRUNE_ACTIVE_WORKOUTS") {
    const activeIds = new Set(event.data.workoutIds ?? []);
    event.waitUntil(
      caches.open(WORKOUT_CACHE).then(async (cache) => {
        const keys = await cache.keys();
        await Promise.all(
          keys.map((request) => {
            const match = /^\/workouts\/([^/]+)$/.exec(new URL(request.url).pathname);
            return match && !activeIds.has(match[1]) ? cache.delete(request) : Promise.resolve(false);
          }),
        );
      }),
    );
  }
});

self.addEventListener("fetch", (event) => {
  const url = new URL(event.request.url);
  if (event.request.method !== "GET" || url.origin !== self.location.origin) return;

  if (url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      caches.match(event.request).then((cached) =>
        cached ?? fetch(event.request).then((response) => {
          const copy = response.clone();
          void caches.open(STATIC_CACHE).then((cache) => cache.put(event.request, copy));
          return response;
        }),
      ),
    );
    return;
  }

  if (
    event.request.mode === "navigate" &&
    /^\/workouts\/[^/]+$/.test(url.pathname)
  ) {
    event.respondWith(
      fetch(event.request).catch(async () =>
        (await caches.match(event.request)) ??
        (await caches.match(OFFLINE_WORKOUT_FALLBACK)),
      ),
    );
  }
});
