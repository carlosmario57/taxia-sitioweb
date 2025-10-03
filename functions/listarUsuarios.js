// listarUsuarios.js
import admin from "firebase-admin";
import { readFileSync } from "fs";

// 🚀 Inicializa Firebase Admin con tus credenciales
const serviceAccount = JSON.parse(
  readFileSync("./serviceAccountKey.json", "utf8")
);

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const listarUsuarios = async (nextPageToken) => {
  try {
    const result = await admin.auth().listUsers(1000, nextPageToken);

    result.users.forEach((user) => {
      console.log("======================================");
      console.log(`UID:   ${user.uid}`);
      console.log(`Email: ${user.email || "N/A"}`);
      console.log(`Tel:   ${user.phoneNumber || "N/A"}`);
      console.log(`Rol:   ${user.customClaims?.rol || "No asignado"}`);
    });

    if (result.pageToken) {
      // 🔁 Continuar si hay más usuarios
      await listarUsuarios(result.pageToken);
    }
  } catch (error) {
    console.error("❌ Error al listar usuarios:", error);
  }
};

listarUsuarios();
