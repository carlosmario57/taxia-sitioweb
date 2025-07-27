import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente DriverList: Muestra la lista de conductores, con opciones para editar y eliminar.
// Ahora recibe 'drivers' como una prop desde App.js, en lugar de cargarlos internamente.
// Recibe props de App.js para el manejo global de estados y mensajes, y funciones de acción.
function DriverList({ drivers, onDriverDeleted, onEditDriver, setGlobalMessage, setGlobalError }) {
  // 'drivers' ahora es una prop, así que no necesitamos un estado 'drivers' interno.
  // Sin embargo, mantenemos 'loading' y 'error' para la eliminación, aunque 'loading'
  // para la carga inicial se gestiona en App.js.
  const [loading, setLoading] = useState(false); // No carga directamente, por eso false por defecto
  const [error, setError] = useState(null);     // Estado de error interno para la lista
  
  /**
   * Fetches the list of drivers from the backend API.
   * NOTA: Esta función ahora solo se usa para RECARGAR la lista después de una eliminación.
   * La carga inicial de 'drivers' la hace App.js y la pasa como prop.
   */
  const fetchDrivers = async () => {
    setLoading(true); // Controla la carga internamente para la operación de eliminación
    setError(null);    // Limpia error interno
    setGlobalMessage(''); // Limpia mensajes globales del padre antes de una nueva operación
    setGlobalError('');   // Limpia errores globales del padre

    try {
      const response = await axios.get('http://localhost:5000/drivers');
      // App.js ya tiene la responsabilidad de setear los drivers,
      // pero si esta función se llama, es para refrescar la lista después de una eliminación
      // y App.js lo manejará a través del refreshDriversKey.
      // Aquí no necesitamos setear 'drivers' porque ya vienen de App.js.
      // Esta función solo se llama cuando se elimina un conductor, y onDriverDeleted en App.js
      // se encargará de actualizar la lista globalmente.
    } catch (err) {
      console.error("Error al obtener conductores para refrescar:", err);
      const errorMessage = err.response?.data?.error || "Error al recargar los conductores después de la eliminación.";
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
        setLoading(true); // Muestra un estado de carga mientras se elimina
        await axios.delete(`http://localhost:5000/drivers/${driverId}`);
        setGlobalMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        setGlobalError(''); // Limpia cualquier error global anterior
        
        // Notifica al componente padre (App.js) que un conductor ha sido eliminado.
        // App.js usará refreshDriversKey para forzar la recarga de la lista.
        if (onDriverDeleted) {
          onDriverDeleted();
        }
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar conductor con ID ${driverId}.`;
        setError(errorMessage); // Establece el error interno
        setGlobalError(errorMessage); // También propaga el error al estado global del padre
        setGlobalMessage(''); // Limpia el mensaje de éxito si hay un error
      } finally {
        setLoading(false); // Deja de cargar después de la eliminación (éxito o error)
      }
    }
  };

  // El useEffect que solía cargar los drivers ahora es menos relevante aquí,
  // ya que los drivers se pasan como prop.
  // El 'key' en App.js se encargará de que este componente se re-renderice
  // y muestre los 'drivers' actualizados cuando App.js los obtenga.
  // No necesitamos un fetch inicial aquí.

  // Renderizado Condicional
  // Si App.js está cargando los drivers, esta lista podría no tenerlos aún.
  // Puedes añadir un indicador de carga si lo deseas, o confiar en el de App.js.
  // Por ahora, solo mostramos si la prop 'drivers' está vacía.
  if (loading) { // Esto es para la carga de la operación de eliminación
    return <p className="text-center text-gray-600 p-4">Procesando eliminación...</p>;
  }

  // Si hay un error interno (ej. al eliminar), se muestra aquí
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
