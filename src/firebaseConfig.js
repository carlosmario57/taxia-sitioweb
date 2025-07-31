// cimco-frontend/src/firebaseConfig.js
// Importa las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Mantener si habilitaste Analytics
import { getAuth } from "firebase/auth"; // ¡NUEVO! Para usar Firebase Authentication

// Tu objeto de configuración de Firebase (el que copiaste de la consola)
const firebaseConfig = {
  apiKey: "AIzaSyAnIb66pu2dCgZyFSc2TERa5uVkQpLLVRM", // Tu API Key
  authDomain: "taxia-cimco.firebaseapp.com", // Tu authDomain
  projectId: "taxia-cimco", // Tu Project ID
  storageBucket: "taxia-cimco.firebasestorage.app", // Tu Storage Bucket
  messagingSenderId: "529767434961", // Tu Messaging Sender ID
  appId: "1:529767434961:web:06e74d1c4f0113d4ff53f0", // Tu App ID
  measurementId: "G-GRGT80HX63" // Tu Measurement ID
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firebase Analytics (si lo habilitaste)
const analytics = getAnalytics(app); // Puedes omitir esta línea si no necesitas Analytics

// ¡NUEVO! Inicializa y exporta la instancia de autenticación
export const auth = getAuth(app); // Esto te permitirá usar 'auth' en tus componentes
export default app; // Exporta 'app' también si necesitas otros servicios de Firebase en el futuro