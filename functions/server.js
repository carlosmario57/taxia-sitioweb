import express from "express";
import cors from "cors";
import admin from "firebase-admin";

// Inicializar Firebase Admin (usa tu serviceAccount.json)
import serviceAccount from "./serviceAccount.json" assert { type: "json" };

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const db = admin.firestore();
const app = express();

app.use(express.json());
app.use(cors({ origin: true }));

// ✅ Registrar conductor
app.post("/registrarConductor", async (req, res) => {
  try {
    const { email, nombre, password, telefono, cedula, tipoVehiculo, placa, numeroInterno, cooperativa } = req.body;

    await db.collection("conductores").add({
      email,
      nombre,
      password,
      telefono,
      cedula,
      tipoVehiculo,
      placa,
      numeroInterno,
      cooperativa,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ message: "Conductor registrado con éxito." });
  } catch (error) {
    console.error("Error al registrar conductor:", error);
    res.status(500).send({ message: "Error interno en el servidor.", error: error.message });
  }
});

// ✅ Registrar pasajero
app.post("/registrarPasajero", async (req, res) => {
  try {
    const { email, nombre, telefono, direccion_recogida } = req.body;

    await db.collection("pasajeros").add({
      email,
      nombre,
      telefono,
      direccion_recogida,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ message: "Pasajero registrado con éxito." });
  } catch (error) {
    console.error("Error al registrar pasajero:", error);
    res.status(500).send({ message: "Error interno en el servidor.", error: error.message });
  }
});

// ✅ Solicitar servicio
app.post("/solicitarServicio", async (req, res) => {
  try {
    const { pasajeroId, origen, destino } = req.body;

    const servicioRef = await db.collection("servicios").add({
      pasajeroId,
      origen,
      destino,
      estado: "pendiente",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    res.status(200).send({ message: "Servicio solicitado con éxito.", id: servicioRef.id });
  } catch (error) {
    console.error("Error al solicitar servicio:", error);
    res.status(500).send({ message: "Error interno en el servidor.", error: error.message });
  }
});

// ✅ Listar servicios
app.get("/listarServicios", async (req, res) => {
  try {
    const snapshot = await db.collection("servicios").orderBy("createdAt", "desc").get();
    const servicios = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    res.status(200).send(servicios);
  } catch (error) {
    console.error("Error al listar servicios:", error);
    res.status(500).send({ message: "Error interno en el servidor.", error: error.message });
  }
});

export default app;
