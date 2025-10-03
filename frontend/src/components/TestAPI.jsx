import React, { useEffect, useState } from "react";
import api from "../api/axiosConfig";

export default function TestAPI() {
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);
  const [pasajero, setPasajero] = useState(null);
  const [conductor, setConductor] = useState(null);
  const [servicios, setServicios] = useState([]);

  // ✅ 1. Probar endpoint /test
  useEffect(() => {
    api.get("/test")
      .then((response) => {
        setMessage(response.data.message + " 🟢");
      })
      .catch((err) => {
        console.error("Error al llamar /test:", err);
        setError("❌ No se pudo conectar al backend");
      });
  }, []);

  // ✅ 2. Crear pasajero demo
  const crearPasajeroDemo = async () => {
    try {
      const res = await api.post("/demoCrearPasajero");
      setPasajero(res.data);
    } catch (err) {
      console.error("❌ Error al crear pasajero demo:", err);
      alert("Error al crear pasajero demo");
    }
  };

  // ✅ 3. Crear conductor demo
  const crearConductorDemo = async () => {
    try {
      const res = await api.post("/demoCrearConductor");
      setConductor(res.data);
    } catch (err) {
      console.error("❌ Error al crear conductor demo:", err);
      alert("Error al crear conductor demo");
    }
  };

  // ✅ 4. Listar servicios
  const cargarServicios = async () => {
    try {
      const res = await api.get("/listarServicios");
      setServicios(res.data);
    } catch (err) {
      console.error("❌ Error al listar servicios:", err);
      alert("No se pudieron cargar los servicios");
    }
  };

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold text-blue-600 mb-6 text-center">
        🛠️ Panel de Pruebas API (TestAPI.jsx)
      </h2>

      {/* Estado backend */}
      {message && <p className="text-green-600 text-center">{message}</p>}
      {error && <p className="text-red-600 text-center">{error}</p>}

      <div className="flex flex-col items-center gap-4 mt-6">
        <button
          onClick={crearPasajeroDemo}
          className="px-6 py-2 bg-green-600 text-white font-medium rounded hover:bg-green-700 transition"
        >
          ➕ Crear Pasajero Demo
        </button>
        {pasajero && (
          <p className="text-gray-700">
            ✅ Pasajero creado: <strong>{pasajero.nombre}</strong> ({pasajero.telefono})
          </p>
        )}

        <button
          onClick={crearConductorDemo}
          className="px-6 py-2 bg-purple-600 text-white font-medium rounded hover:bg-purple-700 transition"
        >
          🚗 Crear Conductor Demo
        </button>
        {conductor && (
          <p className="text-gray-700">
            ✅ Conductor creado: <strong>{conductor.nombre}</strong> ({conductor.telefono})
          </p>
        )}

        <button
          onClick={cargarServicios}
          className="px-6 py-2 bg-blue-600 text-white font-medium rounded hover:bg-blue-700 transition"
        >
          📋 Listar Servicios
        </button>
      </div>

      {/* Lista de servicios */}
      <div className="mt-6">
        {servicios.length > 0 ? (
          <ul className="space-y-2">
            {servicios.map((s) => (
              <li key={s.id} className="p-3 border rounded bg-gray-50 shadow-sm">
                <span className="font-semibold">{s.usuario}</span> →{" "}
                <span className="text-blue-600">{s.destino}</span>{" "}
                <span className="italic text-gray-600">({s.estado})</span>
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
  );
}
