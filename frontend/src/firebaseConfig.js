import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";

// ⚠️ Usa las mismas credenciales públicas de tu proyecto (no privadas)
const firebaseConfig = {
  apiKey: process.env.REACT_APP_MAPS_API_KEY, // puedes usar también otra API key de Firebase
  authDomain: "pelagic-chalice-467818-e1.firebaseapp.com",
  projectId: "pelagic-chalice-467818-e1",
};

const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
