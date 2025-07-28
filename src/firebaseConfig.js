// Importa las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Mantener si habilitaste Analytics
import { getAuth } from "firebase/auth"; // ¡NUEVO! Importa getAuth para Authentication

// Tu objeto de configuración de Firebase (Copia esto de la consola de Firebase)
// Asegúrate de que estos valores son los correctos para tu proyecto Taxia-CIMCO
const firebaseConfig = {
  apiKey: "AIzaSyAnIb66pu2dCgZyFSc2TERa5uVkQpLLVRM", // Ejemplo de API Key
  authDomain: "taxia-cimco.firebaseapp.com", // Ejemplo de Auth Domain
  projectId: "taxia-cimco",                  // Ejemplo de Project ID
  storageBucket: "taxia-cimco.appspot.com",  // Ejemplo de Storage Bucket
  messagingSenderId: "529767434961",         // Ejemplo de Messaging Sender ID
  appId: "1:529767434961:web:06e74d1c4f0113d4ff53f0", // Ejemplo de App ID
  measurementId: "G-GRGT80HX63"              // Ejemplo de Measurement ID (si tienes Analytics)
};

// Inicializa Firebase
const app = initializeApp(firebaseConfig);

// Inicializa Firebase Analytics (si lo habilitaste, si no, puedes comentar esta línea)
const analytics = getAnalytics(app);

// ¡CLAVE! Inicializa y EXPORTA la instancia de autenticación
export const auth = getAuth(app); 

// Puedes exportar 'app' también si necesitas otros servicios de Firebase en el futuro
export default app;
