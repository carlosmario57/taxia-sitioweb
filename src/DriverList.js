import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente DriverList: Muestra la lista de conductores, con opciones para editar y eliminar.
// Recibe props de App.js para el manejo global de estados y mensajes, y funciones de acción.
function DriverList({ onDriverDeleted, onEditDriver, setGlobalMessage, setGlobalError }) {
  // Estados locales para DriverList
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carga interno
  const [error, setError] = useState(null);     // Estado de error interno

  /**
   * Fetches the list of drivers from the backend API.
   * Resets loading and error states before fetching.
   */
  const fetchDrivers = async () => {
    setLoading(true); // Controla la carga internamente
    setError(null);    // Limpia error interno
    setGlobalMessage(''); // Limpia mensajes globales del padre
    setGlobalError('');   // Limpia errores globales del padre

    try {
      // URL CRÍTICA: Asegúrate de que esta URL sea la correcta y coincida con tu backend.
      // Usamos 'localhost' para el desarrollo
      const response = await axios.get('http://localhost:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.";
      setError(errorMessage); // Establece el error interno
      setGlobalError(errorMessage); // También propaga el error al estado global del padre
    } finally {
      setLoading(false); // Siempre deja de cargar.
    }
  };

  /**
   * Handles the deletion of a driver.
   * @param {string} driverId - The ID of the driver to delete.
   */
  const handleDelete = async (driverId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor de forma permanente?')) {
      try {
        await axios.delete(`http://localhost:5000/drivers/${driverId}`);
        // Actualiza el mensaje global del padre con el éxito
        setGlobalMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        setGlobalError(''); // Limpia cualquier error global anterior

        // Notifica al componente padre para que recargue la lista
        if (onDriverDeleted) {
          onDriverDeleted(); // Ya no pasamos el mensaje aquí, App.js lo manejará
        }
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar conductor con ID ${driverId}.`;
        setError(errorMessage); // Establece el error interno
        setGlobalError(errorMessage); // También propaga el error al estado global del padre
        setGlobalMessage(''); // Limpia el mensaje de éxito si hay un error
      }
    }
  };

  // useEffect para cargar los datos al montar el componente
  useEffect(() => {
    fetchDrivers();
  }, []); // Se ejecuta solo una vez al montar

  // Renderizado Condicional
  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando conductores...</p>;
  }

  // Si hay un error al cargar conductores, se muestra aquí
  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Conductores</h2>

      {drivers.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay conductores disponibles. ¡Crea uno!</p>
      ) : (
        <ul className="list-none p-0">
          {drivers.map(driver => (
            <li key={driver.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col">
              <div className="mb-3 text-gray-700 leading-relaxed">
                <p><strong className="text-blue-600">Nombre:</strong> {driver.nombre}</p>
                <p><strong className="text-blue-600">Teléfono:</strong> {driver.telefono}</p>
                <p><strong className="text-blue-600">Vehículo:</strong> {driver.tipoVehiculo}</p>
                <p className="text-xs text-gray-400 mt-1">ID: {driver.id}</p>
              </div>
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => onEditDriver(driver)}
                  className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
                  className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DriverList;