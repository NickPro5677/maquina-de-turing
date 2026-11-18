/* Service worker: guarda los archivos de la web para que funcione sin internet. */
const VERSION = 'maquina-turing-v1.1.1';
const ARCHIVOS = [
  './', './index.html', './manifest.webmanifest', './css/estilos.css',
  './src/app.js', './src/motor/index.js', './src/motor/maquina.js', './src/motor/ejemplos.js',
  './src/motor/textos.js', './src/motor/enlace.js', './src/motor/ejercicios.js', './src/motor/biblioteca.js',
  './src/ui/vista2d.js', './src/ui/vista3d.js', './src/ui/aprende.js', './src/ui/aprende.en.js',
  './src/i18n/index.js', './src/i18n/es.js', './src/i18n/en.js',
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

// Primero la red (para recibir mejoras); si no hay conexión, la copia guardada.
self.addEventListener('fetch', (e) => {
  if (e.request.method !== 'GET' || new URL(e.request.url).origin !== location.origin) return;
  e.respondWith(fetch(e.request).then((resp) => {
    if (resp.ok) { const copia = resp.clone(); caches.open(VERSION).then((c) => c.put(e.request, copia)); }
    return resp;
  }).catch(() => caches.match(e.request, { ignoreSearch: true })
    .then((r) => r || (e.request.mode === 'navigate' ? caches.match('./index.html') : Response.error()))));
});
