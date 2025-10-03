// public/js/firebase-config-pasajero.js
// 🔹 Configuración de Firebase para el rol PASAJERO
// App Web vinculada en Firebase Console: mi-app-viajes

import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

export const firebaseConfig = {
  apiKey: "AIzaSyCseKkOoHY8pbSnUWSEWyPR8et1BVccr7s",
  authDomain: "pelagic-chalice-467818-e1.firebaseapp.com",
  projectId: "pelagic-chalice-467818-e1",
  storageBucket: "pelagic-chalice-467818-e1.firebasestorage.app",
  messagingSenderId: "191106268804",
  appId: "1:191106268804:web:8b2aa9689abaa35c880cd1", // mi-app-viajes
  measurementId: "G-CPWSCLGKP2"
};

// Inicializamos Firebase para el pasajero
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

console.log("✅ Firebase inicializado para PASAJERO (mi-app-viajes)");
