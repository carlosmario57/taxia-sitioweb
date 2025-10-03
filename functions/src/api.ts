import express, { Request, Response } from "express";
import admin from "firebase-admin";
import cors from "cors";

// --- 1. CONFIGURACIÓN E INICIALIZACIÓN (Fallback/Acceso a DB) ---
if (!admin.apps.length) {
  try {
    admin.initializeApp();
  } catch (e) {
    console.warn("Firebase Admin App no fue inicializada explícitamente en api.ts. Asumiendo inicialización por el proceso padre.");
  }
}

const db = admin.firestore();
const app = express();

// --- 2. MIDDLEWARE ---
const corsOptions = {
  origin: true,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
};
app.use(cors(corsOptions));
app.use(express.json());

// --- 3. ENDPOINTS DE PRUEBA Y DEMOSTRACIÓN ---

// Health check principal
app.get("/", (_req: Request, res: Response) => {
  res.status(200).send("Backend TaxiA-CIMCO v2 - Ready ✅ (CORS OK)");
});

// Endpoint de prueba simple (Tu nueva ruta /test)
app.get("/test", (_req: Request, res: Response) => {
  res.json({
    message: "✅ Backend funcionando correctamente desde Firebase Functions",
    timestamp: new Date().toISOString(),
  });
});

// Crear pasajero demo
app.post("/demoCrearPasajero", async (_req: Request, res: Response) => {
  try {
    const nuevoPasajero = {
      nombre: "Pasajero Demo " + new Date().getTime().toString().slice(-4),
      telefono: "+57300" + Math.floor(1000000 + Math.random() * 9000000),
      ubicacion_actual: new admin.firestore.GeoPoint(
        9.5614 + Math.random() * 0.01,
        -73.3381 + Math.random() * 0.01
      ),
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("pasajeros").add(nuevoPasajero);

    res.status(200).json({
      message: "✅ Pasajero demo creado",
      id: docRef.id,
      ...nuevoPasajero,
    });
  } catch (error) {
    console.error("Error al crear pasajero demo:", error);
    res.status(500).json({ error: "Error interno al crear pasajero" });
  }
});

// Crear conductor demo
app.post("/demoCrearConductor", async (_req: Request, res: Response) => {
  try {
    const nuevoConductor = {
      nombre: "Conductor Demo " + new Date().getTime().toString().slice(-4),
      telefono: "+57310" + Math.floor(1000000 + Math.random() * 9000000),
      ubicacion: new admin.firestore.GeoPoint(
        9.5630 + Math.random() * 0.01,
        -73.3305 + Math.random() * 0.01
      ),
      disponible: true,
      tipoVehiculo: "Estándar",
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("conductores").add(nuevoConductor);

    res.status(200).json({
      message: "✅ Conductor demo creado",
      id: docRef.id,
      ...nuevoConductor,
    });
  } catch (error) {
    console.error("Error al crear conductor demo:", error);
    res.status(500).json({ error: "Error interno al crear conductor" });
  }
});

// --- 4. ENDPOINTS DE SERVICIO ---

// Solicitar un servicio
app.post("/solicitarServicio", async (req: Request, res: Response) => {
  try {
    const { usuario, origen, destino } = req.body;

    if (!usuario || !origen || !destino) {
      return res.status(400).json({
        error: "Faltan parámetros: 'usuario', 'origen', y 'destino' son requeridos.",
      });
    }

    const nuevoServicio = {
      usuario,
      origen,
      destino,
      estado: "Pendiente",
      creadoEn: admin.firestore.FieldValue.serverTimestamp(),
    };

    const docRef = await db.collection("servicios").add(nuevoServicio);

    res.status(200).json({
      message: "⏳ Pendiente: Servicio creado, buscando conductor.",
      servicioId: docRef.id,
    });
  } catch (error) {
    console.error("Error al solicitar servicio:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

// Listar servicios
app.get("/listarServicios", async (_req: Request, res: Response) => {
  try {
    const snapshot = await db.collection("servicios").orderBy("creadoEn", "desc").get();
    const servicios = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));

    res.json(servicios);
  } catch (error) {
    console.error("Error al listar servicios:", error);
    res.status(500).json({ error: "Error interno" });
  }
});

export default app;
