// asignarRol.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// 🚀 Inicializa Firebase Admin con tus credenciales
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

// Función para asignar rol
const asignarRol = async (uid, rol) => {
  try {
    // 1. Asignar Custom Claims
    await admin.auth().setCustomUserClaims(uid, { rol });

    // 2. Guardar en Firestore (colección users)
    await admin.firestore().collection("users").doc(uid).set(
      {
        rol,
        updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    console.log(`✅ Rol '${rol}' asignado correctamente al usuario ${uid}`);
    process.exit(0);
  } catch (error) {
    console.error("❌ Error al asignar rol:", error);
    process.exit(1);
  }
};

// ⚡️ Cambia estos valores antes de ejecutar
const UID = "COLOCA_AQUI_EL_UID_DEL_USUARIO";
const ROL = "ceo"; // Ejemplo: "pasajero", "mototaxi", "ceo"

asignarRol(UID, ROL);
