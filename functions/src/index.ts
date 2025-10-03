import * as functions from "firebase-functions";
import app from "./api"; // Express app
import admin from "firebase-admin";
import path from "path";

if (!admin.apps.length) {
  if (process.env.FUNCTIONS_EMULATOR === "true" || process.env.NODE_ENV !== "production") {
    try {
      const serviceAccountPath = path.join(__dirname, "../serviceAccount.json");
      const serviceAccount = require(serviceAccountPath);
      admin.initializeApp({ credential: admin.credential.cert(serviceAccount) });
      console.log("✅ Firebase Admin inicializado con serviceAccount.json (Emulador/Local)");
    } catch (error) {
      console.warn("⚠️ No se pudo cargar serviceAccount.json, inicializando por defecto");
      admin.initializeApp();
    }
  } else {
    admin.initializeApp();
    console.log("✅ Firebase Admin inicializado por defecto (Producción)");
  }
}

export const api = functions.https.onRequest(app);
