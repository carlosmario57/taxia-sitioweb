import axios from "axios";

// ✅ URL base tomada desde .env.local
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL;

// ⚡ Crear instancia de Axios
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 10000, // ⏳ 10s de tiempo máximo por request
});

// ============================================================
// 🛡️ Interceptores para debug y manejo de errores
// ============================================================

// 📤 Interceptor para requests (útil para logging en dev)
api.interceptors.request.use(
  (config) => {
    if (process.env.NODE_ENV === "development") {
      console.log("📤 Request:", config.method?.toUpperCase(), config.url, config.data || "");
    }
    return config;
  },
  (error) => {
    console.error("❌ Error en request:", error);
    return Promise.reject(error);
  }
);

// 📥 Interceptor para responses
api.interceptors.response.use(
  (response) => {
    if (process.env.NODE_ENV === "development") {
      console.log("✅ Response:", response.status, response.data);
    }
    return response;
  },
  (error) => {
    if (error.response) {
      console.error(
        `❌ Error en response [${error.response.status}]:`,
        error.response.data
      );
    } else if (error.request) {
      console.error("⚠️ No hubo respuesta del servidor:", error.request);
    } else {
      console.error("⚡ Error al configurar request:", error.message);
    }
    return Promise.reject(error);
  }
);

export default api;
