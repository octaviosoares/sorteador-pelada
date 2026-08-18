const CACHE_NAME = 'sorteiafut-v2.2';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './icon192.png',
  './icon512.png',
  './logo.jpg'
];

self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS);
    })
  );
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
