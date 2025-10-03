// public/js/firebase-config-motocarga.js
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

// 🔹 Configuración Firebase para MOTOCARGA (proyecto-cimco)
const firebaseConfig = {
  apiKey: "AIzaSyCseKkOoHY8pbSnUWSEWyPR8et1BVccr7s",
  authDomain: "pelagic-chalice-467818-e1.firebaseapp.com",
  projectId: "pelagic-chalice-467818-e1",
  storageBucket: "pelagic-chalice-467818-e1.firebasestorage.app",
  messagingSenderId: "191106268804",
  appId: "1:191106268804:web:1726a607905b63f7880cd1", // ✅ proyecto-cimco
  measurementId: "G-D81K9HVGC9"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

export { app, auth, db };
