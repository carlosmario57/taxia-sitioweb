// Importa las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Mantener si habilitaste Analytics
import { getAuth } from "firebase/auth"; // ¡NUEVO! Para usar Firebase Authentication

// Tu objeto de configuración de Firebase (el que copiaste de la consola)
const firebaseConfig = {
  apiKey: "AIzaSyAnIb66pu2dCgZyFSc2TERa5uVkQpLLVRM",
  authDomain: "taxia-cimco.firebaseapp.com",
  projectId: "taxia-cimco",
  storageBucket: "taxia-cimco.firebasestorage.app",
  messagingSenderId: "529767434961",
  appId: "1:529767434961:web:06e74d1c4f0113d4ff53f0",
  measurementId: "G-GRGT80HX63"
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firebase Analytics (si lo habilitaste)
const analytics = getAnalytics(app);

// ¡NUEVO! Inicializa y exporta la instancia de autenticación
export const auth = getAuth(app); // Puedes exportar 'app' también si necesitas otros servicios de Firebase en el futuro
export default app;