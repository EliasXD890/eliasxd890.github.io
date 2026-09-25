// Offline support. Saves only the app shell plus files the reader has opened.
// Audio and anything from other sites is never touched: it always streams live.
const V = 'WDZANRYO';
const SHELL = ['./','assets/main-WDZANRYO.js','assets/main-LPRYFDWB.css','manifest.webmanifest','icon.svg'];
const CACHE = 'dp-' + V;
// the small symbol strip is part of the shell (save it once here)
const STRIPS = ['https://media.divyaprabandam.workers.dev/media/ec827faa6ec7.png'];
self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(SHELL);
    for (const u of STRIPS) { try { const r = await fetch(u, { mode: 'no-cors' }); await c.put(u, r); } catch (_) {} }
  }).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil((async () => {
    const keys = await caches.keys();
    const old = keys.filter(k => k.startsWith('dp-') && k !== CACHE);
    const cur = await caches.open(CACHE);
    // carry over texts already opened, so an update does not lose them
    for (const k of old) {
      const c = await caches.open(k);
      for (const req of await c.keys()) {
        if ((/\/assets\//.test(req.url) || STRIPS.includes(req.url)) && !/\/assets\/main-/.test(req.url) && !(await cur.match(req))) {
          const r = await c.match(req); if (r) await cur.put(req, r);
        }
      }
      await caches.delete(k);
    }
    await self.clients.claim();
  })());
});
const stem = u => { const m = new URL(u).pathname.match(/\/assets\/(.+)-[A-Z0-9]{8}\.[a-z0-9]+$/); return m ? m[1] : null; };
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (STRIPS.includes(req.url)) {
    e.respondWith(caches.open(CACHE).then(async c => (await c.match(req.url)) || fetch(req).then(r => { c.put(req.url, r.clone()); return r; })));
    return;
  }
  if (url.origin !== location.origin) return;            // Audio and other media: never cached
  if (req.headers.has('range')) return;
  if (req.mode === 'navigate') {
    e.respondWith(fetch(req).then(r => { if (r.ok) caches.open(CACHE).then(c => c.put('./', r.clone())); return r; })
      .catch(() => caches.match('./', { ignoreSearch: true }).then(r => r || caches.match('index.html'))));
    return;
  }
  if (url.pathname.includes('/assets/')) {
    e.respondWith(caches.open(CACHE).then(async c => {
      const hit = await c.match(req); if (hit) return hit;
      const r = await fetch(req);
      if (r.ok) {
        const s = stem(req.url);
        if (s) for (const k of await c.keys()) if (k.url !== req.url && stem(k.url) === s) c.delete(k);
        c.put(req, r.clone());
      }
      return r;
    }));
  }
});
