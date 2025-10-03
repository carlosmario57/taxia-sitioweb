import { defineConfig } from "vite";
import { resolve } from "path";

export default defineConfig({
  root: "./src", // Tu carpeta base donde tienes index.html
  build: {
    outDir: "../dist", // Sale a frontend/dist
    rollupOptions: {
      input: {
        main: resolve(__dirname, "src/index.html"),
        // 🔹 Páginas sueltas
        registroPasajero: resolve(__dirname, "src/pages/registro-pasajero.html"),
        conductorInter: resolve(__dirname, "src/pages/conductorinter.html"),
        mototaxi: resolve(__dirname, "src/pages/conductor/mototaxo.html"),
        motoparrillero: resolve(__dirname, "src/pages/conductor/motoparrillero.html"),
        // 👉 Aquí vas agregando más páginas cuando las vayas creando
      },
    },
  },
});
