import React, { useEffect, useState } from "react";
import api from "./api/axiosConfig";
import { initializeApp } from "firebase/app";
import { getFirestore, collection, onSnapshot } from "firebase/firestore";

// ============================================================
// 🔥 Configuración de Firebase (frontend, solo clave pública)
// Usa las variables de entorno de tu .env.local
// ============================================================
const firebaseConfig = {
  apiKey: process.env.REACT_APP_MAPS_API_KEY, // ya la tienes en .env.local
  authDomain: `${process.env.REACT_APP_PROJECT_ID}.firebaseapp.com`,
  projectId: process.env.REACT_APP_PROJECT_ID,
};

// Inicializar Firebase (solo frontend)
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export default function App() {
  const [status, setStatus] = useState(null);
  const [servicios, setServicios] = useState([]);
  const [loading, setLoading] = useState(false);

  // ✅ Verificar backend
  useEffect(() => {
    api.get("/status")
      .then((res) => {
        setStatus(res.data.message);
      })
      .catch((err) => {
        console.error("❌ Error al conectar con el backend:", err);
        setStatus("❌ Backend no disponible");
      });
  }, []);

  // ✅ Snapshot en tiempo real (Firestore)
  useEffect(() => {
    const unsubscribe = onSnapshot(
      collection(db, "servicios"),
      (snapshot) => {
        const docs = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setServicios(docs);
      },
      (err) => {
        console.error("❌ Error en snapshot:", err);
      }
    );
    return () => unsubscribe();
  }, []);

  // ✅ Cargar servicios manualmente
  const cargarServicios = async () => {
    setLoading(true);
    try {
      const res = await api.get("/listarServicios");
      setServicios(res.data);
    } catch (error) {
      console.error("❌ Error al listar servicios:", error);
      alert("No se pudieron cargar los servicios");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Crear pasajero demo
  const crearPasajeroDemo = async () => {
    try {
      const res = await api.post("/demoCrearPasajero");
      alert(`✅ Pasajero creado con ID: ${res.data.id}`);
      console.log("Pasajero creado:", res.data);
    } catch (error) {
      console.error("❌ Error al crear pasajero demo:", error);
      alert("Error al crear pasajero demo");
    }
  };

  // ✅ Crear conductor demo
  const crearConductorDemo = async () => {
    try {
      const res = await api.post("/demoCrearConductor");
      alert(`✅ Conductor creado con ID: ${res.data.id}`);
      console.log("Conductor creado:", res.data);
    } catch (error) {
      console.error("❌ Error al crear conductor demo:", error);
      alert("Error al crear conductor demo");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="max-w-3xl w-full bg-white shadow-lg rounded-lg p-6">
        
        {/* Título principal */}
        <h1 className="text-3xl font-bold text-center text-blue-700 mb-6">
          🚖 TAXIA CIMCO - Panel de Pruebas
        </h1>

        {/* Estado backend */}
        <p className="mt-2 text-gray-700 text-center">
          <strong>Backend status:</strong>{" "}
          {status ? status : "⏳ Cargando..."}
        </p>

        {/* Botones de acción */}
        <div className="flex flex-wrap justify-center gap-4 mt-6">
          <button
            onClick={cargarServicios}
            className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
            disabled={loading}
          >
            {loading ? "⏳ Cargando..." : "📋 Cargar Servicios"}
          </button>

          <button
            onClick={crearPasajeroDemo}
            className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition"
          >
            ➕ Crear Pasajero Demo
          </button>

          <button
            onClick={crearConductorDemo}
            className="px-6 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition"
          >
            🚗 Crear Conductor Demo
          </button>
        </div>

        {/* Lista de servicios en tiempo real */}
        <div className="mt-8">
          {servicios.length > 0 ? (
            <ul className="space-y-2">
              {servicios.map((s) => (
                <li
                  key={s.id}
                  className="p-3 border rounded bg-gray-50 shadow-sm"
                >
                  <span className="font-semibold">{s.usuario}</span> →{" "}
                  <span className="text-blue-600">{s.destino}</span>{" "}
                  <span className="italic text-gray-600">
                    ({s.estado})
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center">
              No hay servicios cargados todavía.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
