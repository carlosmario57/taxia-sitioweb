const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require("cors")({ origin: true });

if (!admin.apps.length) {
  admin.initializeApp();
}

exports.registrarConductor = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== "POST") {
        return res.status(405).send("Método no permitido");
      }

      const data = req.body;

      // Validación rápida
      if (!data.nombre || !data.email || !data.cedula) {
        return res.status(400).send({ ok: false, msg: "Faltan campos obligatorios" });
      }

      // Crear documento en Firestore
      const nuevoConductor = {
        nombre: data.nombre,
        email: data.email,
        telefono: data.telefono || "",
        cedula: data.cedula,
        tipoRol: data.tipoRol || "mototaxi", // por defecto
        placa: data.placa || "",
        numeroMovil: data.numeroMovil || "",
        cooperativa: data.cooperativa || "",
        creado: admin.firestore.FieldValue.serverTimestamp(),
      };

      await admin.firestore().collection("conductores").add(nuevoConductor);

      return res.status(200).send({ ok: true, msg: "Conductor registrado correctamente" });
    } catch (error) {
      console.error("Error en registrarConductor:", error);
      return res.status(500).send({ ok: false, msg: "Error interno del servidor" });
    }
  });
});
