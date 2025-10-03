import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { VitePWA } from "vite-plugin-pwa";
import fs from "fs";

// 🚖 Leer el rol desde variables de entorno (.env)
const ROL_ACTUAL = process.env.VITE_APP_ROLE || "pasajero";

// 📂 Archivo de manifest según el rol
const manifestPath = `./public/manifest-${ROL_ACTUAL}.webmanifest`;

// ✅ Intentar cargar manifest dinámico
let manifestConfig = {};
try {
  if (fs.existsSync(manifestPath)) {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifestConfig = JSON.parse(raw); // ⚠️ El archivo debe ser JSON válido
    console.log(`✅ Usando manifest para el rol: ${ROL_ACTUAL}`);
  } else {
    console.warn(`⚠️ No encontré ${manifestPath}, usando manifest por defecto.`);
    manifestConfig = {
      name: "TaxiA CIMCO",
      short_name: "TaxiA",
      start_url: "/",
      display: "standalone",
      background_color: "#ffffff",
      theme_color: "#2563eb",
      icons: [
        {
          src: "pwa-192x192.png",
          sizes: "192x192",
          type: "image/png",
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png",
        },
      ],
    };
  }
} catch (err) {
  console.error("❌ Error al parsear manifest:", err);
  process.exit(1);
}

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      manifest: manifestConfig,
    }),
  ],
  server: {
    port: 5173,
    open: true,
  },
});
