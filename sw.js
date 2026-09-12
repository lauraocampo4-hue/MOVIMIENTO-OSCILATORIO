/**
 * SERVICE WORKER - CACHÉ OFFLINE PARA EL CUADERNO DIGITAL DE FÍSICA III
 */
const CACHE_NAME = 'fisica-iii-v4';
const ASSETS_TO_CACHE = [
  './',
  './index.html',
  './manifest.json',
  './css/main.css',
  './css/notebook.css',
  './css/geogebra-canvas.css',
  './css/exercises.css',
  './css/components.css',
  './js/geogebraEngine.js',
  './js/physicsSimulation.js',
  './js/mindmap.js',
  './js/app.js',
  './IMAGENES/portadaa.png',
  './IMAGENES/2pag.png',
  './IMAGENES/contenidos.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            return caches.delete(key);
          }
        })
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  e.respondWith(
    caches.match(e.request).then((res) => {
      return res || fetch(e.request);
    })
  );
});
