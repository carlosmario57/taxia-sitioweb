// vite.config.mjs
import { defineConfig } from "file:///C:/Users/Carlos%20Fuentes/ProyectosCIMCO/frontend/node_modules/vite/dist/node/index.js";
import react from "file:///C:/Users/Carlos%20Fuentes/ProyectosCIMCO/frontend/node_modules/@vitejs/plugin-react/dist/index.js";
import { VitePWA } from "file:///C:/Users/Carlos%20Fuentes/ProyectosCIMCO/frontend/node_modules/vite-plugin-pwa/dist/index.js";
import fs from "fs";
var ROL_ACTUAL = process.env.VITE_APP_ROLE || "pasajero";
var manifestPath = `./public/manifest-${ROL_ACTUAL}.webmanifest`;
var manifestConfig = {};
try {
  if (fs.existsSync(manifestPath)) {
    const raw = fs.readFileSync(manifestPath, "utf-8");
    manifestConfig = JSON.parse(raw);
    console.log(`\u2705 Usando manifest para el rol: ${ROL_ACTUAL}`);
  } else {
    console.warn(`\u26A0\uFE0F No encontr\xE9 ${manifestPath}, usando manifest por defecto.`);
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
          type: "image/png"
        },
        {
          src: "pwa-512x512.png",
          sizes: "512x512",
          type: "image/png"
        }
      ]
    };
  }
} catch (err) {
  console.error("\u274C Error al parsear manifest:", err);
  process.exit(1);
}
var vite_config_default = defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: "autoUpdate",
      devOptions: { enabled: true },
      manifest: manifestConfig
    })
  ],
  server: {
    port: 5173,
    open: true
  }
});
export {
  vite_config_default as default
};
//# sourceMappingURL=data:application/json;base64,ewogICJ2ZXJzaW9uIjogMywKICAic291cmNlcyI6IFsidml0ZS5jb25maWcubWpzIl0sCiAgInNvdXJjZXNDb250ZW50IjogWyJjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZGlybmFtZSA9IFwiQzpcXFxcVXNlcnNcXFxcQ2FybG9zIEZ1ZW50ZXNcXFxcUHJveWVjdG9zQ0lNQ09cXFxcZnJvbnRlbmRcIjtjb25zdCBfX3ZpdGVfaW5qZWN0ZWRfb3JpZ2luYWxfZmlsZW5hbWUgPSBcIkM6XFxcXFVzZXJzXFxcXENhcmxvcyBGdWVudGVzXFxcXFByb3llY3Rvc0NJTUNPXFxcXGZyb250ZW5kXFxcXHZpdGUuY29uZmlnLm1qc1wiO2NvbnN0IF9fdml0ZV9pbmplY3RlZF9vcmlnaW5hbF9pbXBvcnRfbWV0YV91cmwgPSBcImZpbGU6Ly8vQzovVXNlcnMvQ2FybG9zJTIwRnVlbnRlcy9Qcm95ZWN0b3NDSU1DTy9mcm9udGVuZC92aXRlLmNvbmZpZy5tanNcIjtpbXBvcnQgeyBkZWZpbmVDb25maWcgfSBmcm9tIFwidml0ZVwiO1xyXG5pbXBvcnQgcmVhY3QgZnJvbSBcIkB2aXRlanMvcGx1Z2luLXJlYWN0XCI7XHJcbmltcG9ydCB7IFZpdGVQV0EgfSBmcm9tIFwidml0ZS1wbHVnaW4tcHdhXCI7XHJcbmltcG9ydCBmcyBmcm9tIFwiZnNcIjtcclxuXHJcbi8vIFx1RDgzRFx1REU5NiBMZWVyIGVsIHJvbCBkZXNkZSB2YXJpYWJsZXMgZGUgZW50b3JubyAoLmVudilcclxuY29uc3QgUk9MX0FDVFVBTCA9IHByb2Nlc3MuZW52LlZJVEVfQVBQX1JPTEUgfHwgXCJwYXNhamVyb1wiO1xyXG5cclxuLy8gXHVEODNEXHVEQ0MyIEFyY2hpdm8gZGUgbWFuaWZlc3Qgc2VnXHUwMEZBbiBlbCByb2xcclxuY29uc3QgbWFuaWZlc3RQYXRoID0gYC4vcHVibGljL21hbmlmZXN0LSR7Uk9MX0FDVFVBTH0ud2VibWFuaWZlc3RgO1xyXG5cclxuLy8gXHUyNzA1IEludGVudGFyIGNhcmdhciBtYW5pZmVzdCBkaW5cdTAwRTFtaWNvXHJcbmxldCBtYW5pZmVzdENvbmZpZyA9IHt9O1xyXG50cnkge1xyXG4gIGlmIChmcy5leGlzdHNTeW5jKG1hbmlmZXN0UGF0aCkpIHtcclxuICAgIGNvbnN0IHJhdyA9IGZzLnJlYWRGaWxlU3luYyhtYW5pZmVzdFBhdGgsIFwidXRmLThcIik7XHJcbiAgICBtYW5pZmVzdENvbmZpZyA9IEpTT04ucGFyc2UocmF3KTsgLy8gXHUyNkEwXHVGRTBGIEVsIGFyY2hpdm8gZGViZSBzZXIgSlNPTiB2XHUwMEUxbGlkb1xyXG4gICAgY29uc29sZS5sb2coYFx1MjcwNSBVc2FuZG8gbWFuaWZlc3QgcGFyYSBlbCByb2w6ICR7Uk9MX0FDVFVBTH1gKTtcclxuICB9IGVsc2Uge1xyXG4gICAgY29uc29sZS53YXJuKGBcdTI2QTBcdUZFMEYgTm8gZW5jb250clx1MDBFOSAke21hbmlmZXN0UGF0aH0sIHVzYW5kbyBtYW5pZmVzdCBwb3IgZGVmZWN0by5gKTtcclxuICAgIG1hbmlmZXN0Q29uZmlnID0ge1xyXG4gICAgICBuYW1lOiBcIlRheGlBIENJTUNPXCIsXHJcbiAgICAgIHNob3J0X25hbWU6IFwiVGF4aUFcIixcclxuICAgICAgc3RhcnRfdXJsOiBcIi9cIixcclxuICAgICAgZGlzcGxheTogXCJzdGFuZGFsb25lXCIsXHJcbiAgICAgIGJhY2tncm91bmRfY29sb3I6IFwiI2ZmZmZmZlwiLFxyXG4gICAgICB0aGVtZV9jb2xvcjogXCIjMjU2M2ViXCIsXHJcbiAgICAgIGljb25zOiBbXHJcbiAgICAgICAge1xyXG4gICAgICAgICAgc3JjOiBcInB3YS0xOTJ4MTkyLnBuZ1wiLFxyXG4gICAgICAgICAgc2l6ZXM6IFwiMTkyeDE5MlwiLFxyXG4gICAgICAgICAgdHlwZTogXCJpbWFnZS9wbmdcIixcclxuICAgICAgICB9LFxyXG4gICAgICAgIHtcclxuICAgICAgICAgIHNyYzogXCJwd2EtNTEyeDUxMi5wbmdcIixcclxuICAgICAgICAgIHNpemVzOiBcIjUxMng1MTJcIixcclxuICAgICAgICAgIHR5cGU6IFwiaW1hZ2UvcG5nXCIsXHJcbiAgICAgICAgfSxcclxuICAgICAgXSxcclxuICAgIH07XHJcbiAgfVxyXG59IGNhdGNoIChlcnIpIHtcclxuICBjb25zb2xlLmVycm9yKFwiXHUyNzRDIEVycm9yIGFsIHBhcnNlYXIgbWFuaWZlc3Q6XCIsIGVycik7XHJcbiAgcHJvY2Vzcy5leGl0KDEpO1xyXG59XHJcblxyXG5leHBvcnQgZGVmYXVsdCBkZWZpbmVDb25maWcoe1xyXG4gIHBsdWdpbnM6IFtcclxuICAgIHJlYWN0KCksXHJcbiAgICBWaXRlUFdBKHtcclxuICAgICAgcmVnaXN0ZXJUeXBlOiBcImF1dG9VcGRhdGVcIixcclxuICAgICAgZGV2T3B0aW9uczogeyBlbmFibGVkOiB0cnVlIH0sXHJcbiAgICAgIG1hbmlmZXN0OiBtYW5pZmVzdENvbmZpZyxcclxuICAgIH0pLFxyXG4gIF0sXHJcbiAgc2VydmVyOiB7XHJcbiAgICBwb3J0OiA1MTczLFxyXG4gICAgb3BlbjogdHJ1ZSxcclxuICB9LFxyXG59KTtcclxuIl0sCiAgIm1hcHBpbmdzIjogIjtBQUE2VSxTQUFTLG9CQUFvQjtBQUMxVyxPQUFPLFdBQVc7QUFDbEIsU0FBUyxlQUFlO0FBQ3hCLE9BQU8sUUFBUTtBQUdmLElBQU0sYUFBYSxRQUFRLElBQUksaUJBQWlCO0FBR2hELElBQU0sZUFBZSxxQkFBcUIsVUFBVTtBQUdwRCxJQUFJLGlCQUFpQixDQUFDO0FBQ3RCLElBQUk7QUFDRixNQUFJLEdBQUcsV0FBVyxZQUFZLEdBQUc7QUFDL0IsVUFBTSxNQUFNLEdBQUcsYUFBYSxjQUFjLE9BQU87QUFDakQscUJBQWlCLEtBQUssTUFBTSxHQUFHO0FBQy9CLFlBQVEsSUFBSSx1Q0FBa0MsVUFBVSxFQUFFO0FBQUEsRUFDNUQsT0FBTztBQUNMLFlBQVEsS0FBSywrQkFBa0IsWUFBWSxnQ0FBZ0M7QUFDM0UscUJBQWlCO0FBQUEsTUFDZixNQUFNO0FBQUEsTUFDTixZQUFZO0FBQUEsTUFDWixXQUFXO0FBQUEsTUFDWCxTQUFTO0FBQUEsTUFDVCxrQkFBa0I7QUFBQSxNQUNsQixhQUFhO0FBQUEsTUFDYixPQUFPO0FBQUEsUUFDTDtBQUFBLFVBQ0UsS0FBSztBQUFBLFVBQ0wsT0FBTztBQUFBLFVBQ1AsTUFBTTtBQUFBLFFBQ1I7QUFBQSxRQUNBO0FBQUEsVUFDRSxLQUFLO0FBQUEsVUFDTCxPQUFPO0FBQUEsVUFDUCxNQUFNO0FBQUEsUUFDUjtBQUFBLE1BQ0Y7QUFBQSxJQUNGO0FBQUEsRUFDRjtBQUNGLFNBQVMsS0FBSztBQUNaLFVBQVEsTUFBTSxxQ0FBZ0MsR0FBRztBQUNqRCxVQUFRLEtBQUssQ0FBQztBQUNoQjtBQUVBLElBQU8sc0JBQVEsYUFBYTtBQUFBLEVBQzFCLFNBQVM7QUFBQSxJQUNQLE1BQU07QUFBQSxJQUNOLFFBQVE7QUFBQSxNQUNOLGNBQWM7QUFBQSxNQUNkLFlBQVksRUFBRSxTQUFTLEtBQUs7QUFBQSxNQUM1QixVQUFVO0FBQUEsSUFDWixDQUFDO0FBQUEsRUFDSDtBQUFBLEVBQ0EsUUFBUTtBQUFBLElBQ04sTUFBTTtBQUFBLElBQ04sTUFBTTtBQUFBLEVBQ1I7QUFDRixDQUFDOyIsCiAgIm5hbWVzIjogW10KfQo=
