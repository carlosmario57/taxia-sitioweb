const CACHE_NAME = "cimco-cache-v3";

// Archivos a cachear
const urlsToCache = [
  "/",
  "/index.html",
  "/manifest.json",

  // === VISTAS ===
  // Pasajero
  "/pasajero/pasajero.html",
  "/pasajero/login-pasajero.html",
  "/pasajero/registro-pasajero.html",
  "/pasajero/solicitar-viaje.html",
  "/pasajero/historial-viajes.html",
  "/pasajero/panel-pasajero.html",

  // Conductor
  "/conductor/mototaxi.html",
  "/conductor/motoparrillero.html",
  "/conductor/motocarga.html",
  "/conductor/conductorinter.html",
  "/conductor/login-conductor.html",
  "/conductor/registro-conductor.html",
  "/conductor/panel-conductor.html",
  "/conductor/viajes-asignados.html",
  "/conductor/historial.html",

  // Despachador
  "/despachador/despachadorinter.html",
  "/despachador/login-despachador.html",
  "/despachador/registro-despachador.html",
  "/despachador/panel-despachador.html",
  "/despachador/asignar-viajes.html",
  "/despachador/monitoreo.html",

  // Admin / CEO
  "/admin/ceo-panel.html",
  "/admin/ceo-mapa.html",
  "/admin/detalle-conductor.html",
  "/admin/detalle-viaje.html",
  "/admin/listado-viajes.html",
  "/admin/panel-credito.html",
  "/admin/panel-whats.html",
  "/admin/qr-generador.html",

  // === MANIFESTS ===
  "/manifest-pasajero.webmanifest",
  "/manifest-mototaxi.webmanifest",
  "/manifest-motoparrillero.webmanifest",
  "/manifest-motocarga.webmanifest",
  "/manifest-despachador.webmanifest",
  "/manifest-conductorinter.webmanifest",

  // === ICONOS ===
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

  // === ESTILOS Y JS ===
  "/css/style.css",
  "/js/firebase-config.js",
  "/js/firebase-config-pasajero.js",
  "/js/firebase-config-mototaxi.js",
  "/js/firebase-config-motoparrillero.js",
  "/js/firebase-config-motocarga.js",
  "/js/firebase-config-despachadorinter.js",
  "/js/firebase-config-conductorinter.js",
  "/js/firebase-config-ceo.js"
];

// === INSTALACIÓN ===
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      console.log("📦 Archivos cacheados correctamente");
      return cache.addAll(urlsToCache);
    }).catch(err => {
      console.error("❌ Error cacheando archivos:", err);
    })
  );
});

// === ACTIVACIÓN ===
self.addEventListener("activate", event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.map(key => {
          if (key !== CACHE_NAME) {
            console.log("🗑 Eliminando caché antigua:", key);
            return caches.delete(key);
          }
        })
      )
    )
  );
});

// === FETCH ===
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request)
      .then(response => response || fetch(event.request))
      .catch(() => caches.match("/index.html"))
  );
});
