import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente AssignDriverModal: Un modal para asignar un conductor a un viaje.
// Recibe:
// - travelToAssign: El objeto del viaje al que se le asignará un conductor.
// - drivers: La lista de conductores disponibles para seleccionar.
// - onClose: Función de callback para cerrar el modal.
// - onAssignSuccess: Función de callback para notificar a App.js que la asignación fue exitosa.
// - setGlobalMessage: Función para mostrar mensajes de éxito globales en App.js.
// - setGlobalError: Función para mostrar mensajes de error globales en App.js.
function AssignDriverModal({ travelToAssign, drivers, onClose, onAssignSuccess, setGlobalMessage, setGlobalError }) {
  const [selectedDriverId, setSelectedDriverId] = useState('');
  const [loading, setLoading] = useState(false);
  const [localError, setLocalError] = useState(''); // Errores específicos del modal

  // Limpia errores locales al abrir el modal o cambiar el viaje a asignar
  useEffect(() => {
    setLocalError('');
    // Si el viaje ya tiene un conductor asignado, preseleccionar en el dropdown
    if (travelToAssign && travelToAssign.conductor_id) {
      setSelectedDriverId(travelToAssign.conductor_id);
    } else {
      setSelectedDriverId(''); // Asegurarse de que no haya selección previa
    }
  }, [travelToAssign]);

  /**
   * Maneja la asignación del conductor al viaje.
   */
  const handleAssign = async () => {
    setLocalError(''); // Limpia errores locales
    setGlobalMessage(''); // Limpia mensajes globales
    setGlobalError('');   // Limpia errores globales

    if (!selectedDriverId) {
      setLocalError('Por favor, selecciona un conductor.');
      return;
    }

    setLoading(true);
    try {
      // Encuentra el nombre del conductor seleccionado
      const driver = drivers.find(d => d.id === selectedDriverId);
      if (!driver) {
        setLocalError('Conductor seleccionado no encontrado.');
        setLoading(false);
        return;
      }

      // Prepara los datos para actualizar el viaje
      const updateData = {
        conductor_id: selectedDriverId,
        conductor_nombre: driver.nombre, // Guarda el nombre del conductor para facilitar la visualización
        estado: 'asignado' // Cambia el estado del viaje a 'asignado'
      };

      // Realiza la petición PUT al backend para actualizar el viaje
      await axios.put(`http://localhost:5000/viajes/${travelToAssign.id}`, updateData);
      
      setGlobalMessage(`Viaje para "${travelToAssign.pasajero_nombre}" asignado a "${driver.nombre}" exitosamente.`);
      onAssignSuccess(); // Notifica al padre que la asignación fue exitosa
    } catch (err) {
      console.error("Error al asignar conductor:", err);
      const errorMessage = err.response?.data?.error || "Error al asignar el conductor al viaje.";
      setLocalError(errorMessage); // Muestra el error en el modal
      setGlobalError(errorMessage); // También propaga el error globalmente
    } finally {
      setLoading(false);
    }
  };

  if (!travelToAssign) {
    return null; // No renderiza el modal si no hay un viaje para asignar
  }

  return (
    // Overlay del modal para oscurecer el fondo
    <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50 p-4">
      {/* Contenido del modal */}
      <div className="bg-white rounded-lg shadow-xl p-6 w-full max-w-sm mx-auto transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
        <h3 className="text-2xl font-bold text-gray-900 mb-4 text-center">Asignar Conductor a Viaje</h3>
        <p className="text-gray-700 mb-4 text-center">
          Viaje de: <span className="font-semibold">{travelToAssign.pasajero_nombre}</span>
        </p>
        <p className="text-gray-600 text-sm mb-6 text-center">
          Origen: {travelToAssign.ubicacion_origen_texto || (travelToAssign.ubicacion_origen_lat && travelToAssign.ubicacion_origen_lon ? `GPS: ${travelToAssign.ubicacion_origen_lat}, ${travelToAssign.ubicacion_origen_lon}` : 'N/A')}
        </p>

        {localError && (
          <p className="text-red-600 text-center mb-4">{localError}</p>
        )}

        <div className="mb-6">
          <label htmlFor="select-driver" className="block text-gray-700 text-sm font-bold mb-2">Seleccionar Conductor:</label>
          <select
            id="select-driver"
            value={selectedDriverId}
            onChange={(e) => setSelectedDriverId(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={loading} // Deshabilita el selector mientras carga
          >
            <option value="">-- Selecciona un conductor --</option>
            {drivers.map(driver => (
              <option key={driver.id} value={driver.id}>
                {driver.nombre} ({driver.tipoVehiculo})
              </option>
            ))}
          </select>
          {drivers.length === 0 && (
            <p className="text-sm text-gray-500 mt-2">No hay conductores disponibles. Por favor, crea uno primero.</p>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            disabled={loading}
          >
            Cancelar
          </button>
          <button
            type="button"
            onClick={handleAssign}
            className={`
              ${loading ? 'bg-blue-400' : 'bg-blue-600 hover:bg-blue-700'}
              text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out
            `}
            disabled={loading || !selectedDriverId} // Deshabilita si está cargando o no hay conductor seleccionado
          >
            {loading ? 'Asignando...' : 'Asignar Conductor'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AssignDriverModal;