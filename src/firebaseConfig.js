// cimco-frontend/src/firebaseConfig.js

// Importa las funciones necesarias del SDK de Firebase
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics"; // Mantener si habilitaste Analytics
import { getAuth } from "firebase/auth"; // Importa getAuth para usar Firebase Authentication

// Tu objeto de configuración de Firebase.
// Asegúrate de que estos valores coincidan exactamente con los de tu proyecto Firebase.
const firebaseConfig = {
  apiKey: "AIzaSyAnIb66pu2dCgZyFSc2TERa5uVkQpLLVRM", // Tu API Key
  authDomain: "taxia-cimco.firebaseapp.com", // Tu authDomain
  projectId: "taxia-cimco", // Tu Project ID
  storageBucket: "taxia-cimco.firebasestorage.app", // Tu Storage Bucket
  messagingSenderId: "529767434961", // Tu Messaging Sender ID
  appId: "1:529767434961:web:06e74d1c4f0113d4ff53f0", // Tu App ID
  measurementId: "G-GRGT80HX63" // Tu Measurement ID (si usas Google Analytics para Firebase)
};

// Inicializa Firebase con tu configuración
const app = initializeApp(firebaseConfig);

// Inicializa Firebase Analytics (si lo habilitaste en tu proyecto Firebase)
// Si no lo necesitas, puedes comentar o eliminar esta línea y su importación.
const analytics = getAnalytics(app); 

// Inicializa y exporta la instancia de autenticación de Firebase.
// Esto permite que otros componentes de tu aplicación (como LoginForm) interactúen con la autenticación.
export const auth = getAuth(app); 

// Exporta la instancia principal de la aplicación Firebase.
// Esto es útil si necesitas acceder a otros servicios de Firebase (como Firestore, Storage, etc.)
// en otros lugares de tu aplicación, inicializándolos con 'app'.
export default app; 
