const CACHE = 'dilla-v4';
const ASSETS = [
  '/',
  '/signin',
  '/cafeteria',
  '/admin',
  '/register',
  '/capture-face',
  '/css/app.css',
  '/js/api.js',
  '/js/scanner.js',
  '/js/ui.js',
  '/js/face-helper.js',
  '/manifest.json',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE)
      .then((c) => c.addAll(ASSETS).catch(err => console.warn('Some assets failed:', err)))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const { request } = e;

  if (request.url.includes('/api/')) return;
  if (request.method !== 'GET') return;

  e.respondWith(
    caches.match(request).then((cached) => {
      const fetchPromise = fetch(request).then((res) => {
        if (res && res.status === 200 && res.type === 'basic') {
          const clone = res.clone();
          caches.open(CACHE).then((c) => c.put(request, clone));
        }
        return res;
      }).catch(() => cached);

      return cached || fetchPromise;
    })
  );
});
