const CACHE_NAME = 'terminal-cache-v1';
const ASSETS = [
    './index.html',
    './css/style.css',
    './js/app.js',
    './js/base.js',
    './js/crypto.js'
];

self.addEventListener('install', (e) => {
    e.waitUntil(caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)));
});

self.addEventListener('fetch', (e) => {
    e.respondWith(caches.match(e.request).then((response) => response || fetch(e.request)));
});