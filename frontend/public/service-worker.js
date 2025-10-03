const CACHE_NAME = "cimco-cache-v2"; 

// Archivos a cachear (puedes agregar más si lo requieres)
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",

  // Vistas principales
  "/pasajero.html",
  "/mototaxi.html",
  "/motoparrillero.html",
  "/motocarga.html",
  "/despachadorinter.html",
  "/conductorinter.html",
  "/ceo-panel.html",

  // Manifests específicos
  "/manifest-pasajero.webmanifest",
  "/manifest-mototaxi.webmanifest",
  "/manifest-motoparrillero.webmanifest",
  "/manifest-motocarga.webmanifest",
  "/manifest-despachadorinter.webmanifest",
  "/manifest-conductorinter.webmanifest",
  "/manifest-ceo.webmanifest",

  // Estilos e iconos
  "/icons/motocarga-192.png",
  "/icons/motocarga-512.png",
  "/icons/mototaxi-192.png",
  "/icons/mototaxi-512.png",
  "/icons/motoparrillero-192.png",
  "/icons/motoparrillero-512.png",
  "/icons/pasajero-192.png",
  "/icons/pasajero-512.png",
  "/icons/despachadorinter-192.png",
  "/icons/despachadorinter-512.png",
  "/icons/conductorinter-192.png",
  "/icons/conductorinter-512.png",
  "/icons/ceo-192.png",
  "/icons/ceo-512.png",

  // Scripts comunes
  "/js/firebase-config.js",
  "/js/firebase-config-motocarga.js",
  "/js/firebase-config-mototaxi.js",
  "/js/firebase-config-pasajero.js"
];

// Instalar y guardar en caché
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("📦 Archivos cacheados");
      return cache.addAll(urlsToCache);
    })
  );
});

// Activar y limpiar versiones antiguas
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(cacheNames =>
      Promise.all(
        cacheNames.map(cache => {
          if (cache !== CACHE_NAME) {
            console.log("🗑 Borrando caché antigua:", cache);
            return caches.delete(cache);
          }
        })
      )
    )
  );
});

// Interceptar requests
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      // Devuelve lo cacheado o busca en la red
      return response || fetch(event.request);
    }).catch(() => {
      // Podrías mostrar una página offline personalizada
      return caches.match("/index.html");
    })
  );
});
