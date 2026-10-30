/* Service worker: guarda los archivos de la web para que funcione sin internet. */
const VERSION = 'maquina-turing-v1.0.0';
const ARCHIVOS = [
  './', './index.html', './manifest.webmanifest', './css/estilos.css',
  './src/app.js', './src/motor/index.js', './src/motor/maquina.js', './src/motor/ejemplos.js',
  './src/ui/vista2d.js', './src/ui/vista3d.js', './src/ui/aprende.js',
  './vendor/three/three.module.min.js', './vendor/three/addons/OrbitControls.js',
  './icons/icono.svg', './icons/icono-192.png', './icons/icono-512.png',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(ARCHIVOS)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((claves) => Promise.all(claves.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});

// Primero la caché; si no está, la red (y se guarda para la próxima vez).
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then((r) => r || fetch(e.request).then((resp) => {
    if (resp.ok) { const copia = resp.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
    return resp;
  })));
});
