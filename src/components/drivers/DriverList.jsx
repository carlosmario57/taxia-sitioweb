import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Importaciones de React y librerías externas.

/**
 * Componente DriverList: Muestra la lista de conductores con búsqueda, edición y eliminación.
 *
 * @param {Function} onDriverDeleted - Función para notificar al padre sobre la eliminación.
 * @param {Function} onEditDriver - Función para iniciar el modo de edición de un conductor.
 * @param {Function} setGlobalMessage - Función para establecer un mensaje global de éxito.
 * @param {Function} setGlobalError - Función para establecer un mensaje global de error.
 */
function DriverList({ onDriverDeleted, onEditDriver, setGlobalMessage, setGlobalError }) {
  // Estados para gestionar la lista de conductores, carga, errores y búsqueda.
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Estados para el modal de confirmación de eliminación.
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [driverToDelete, setDriverToDelete] = useState(null);

  /**
   * Función para obtener los conductores del backend.
   */
  const fetchDrivers = useCallback(async (currentSearchTerm = '') => {
    setLoading(true);
    setError(null);
    setGlobalMessage('');
    setGlobalError('');

    try {
      const url = currentSearchTerm ? `http://localhost:5000/drivers?nombre=${currentSearchTerm}` : 'http://localhost:5000/drivers';
      const response = await axios.get(url);
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los conductores. Asegúrate de que el backend esté funcionando.";
      setError(errorMessage);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setGlobalError, setGlobalMessage]);

  /**
   * Maneja el cambio en el campo de búsqueda.
   * @param {Object} e - Evento de cambio del input.
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  /**
   * Maneja el envío del formulario de búsqueda.
   * @param {Object} e - Evento de envío del formulario.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchDrivers(searchTerm);
  };

  /**
   * Abre el modal de confirmación de eliminación.
   * @param {string} driverId - El ID del conductor a eliminar.
   */
  const handleOpenDeleteModal = (driverId) => {
    setDriverToDelete(driverId);
    setShowDeleteModal(true);
  };

  /**
   * Cierra el modal de confirmación.
   */
  const handleCloseDeleteModal = () => {
    setShowDeleteModal(false);
    setDriverToDelete(null);
  };
  
  /**
   * Función para ejecutar la eliminación del conductor después de la confirmación.
   */
  const handleDeleteConfirmed = async () => {
    if (!driverToDelete) return;

    try {
      await axios.delete(`http://localhost:5000/drivers/${driverToDelete}`);
      setGlobalMessage(`Conductor con ID ${driverToDelete} eliminado exitosamente.`);
      setGlobalError('');
      
      // Vuelve a cargar la lista de conductores después de la eliminación.
      fetchDrivers(searchTerm);
      if (onDriverDeleted) {
        onDriverDeleted();
      }
    } catch (err) {
      console.error("Error al eliminar conductor:", err);
      const errorMessage = err.response?.data?.error || `Error al eliminar conductor con ID ${driverToDelete}.`;
      setGlobalError(errorMessage);
    } finally {
      handleCloseDeleteModal();
    }
  };

  // Carga inicial de la lista de conductores.
  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // Renderizado condicional de la lista.
  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando conductores...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-xl bg-white w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Conductores</h2>

      <form onSubmit={handleSearchSubmit} className="mb-6 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={handleSearchChange}
          className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500"
        />
        <button
          type="submit"
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
        >
          Buscar
        </button>
      </form>
          
      {drivers.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay conductores disponibles.</p>
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
                  onClick={() => handleOpenDeleteModal(driver.id)}
                  className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                >
                  Eliminar
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
      
      {/* Modal de Confirmación de Eliminación */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
          <div className="relative p-8 border rounded-xl shadow-lg bg-white mx-auto max-w-sm w-full">
            <h3 className="text-lg font-bold text-gray-900 text-center">Confirmar Eliminación</h3>
            <div className="mt-2 text-center text-gray-600">
              <p>¿Estás seguro de que quieres eliminar este conductor de forma permanente?</p>
            </div>
            <div className="flex justify-center gap-4 mt-6">
              <button
                onClick={handleDeleteConfirmed}
                className="px-4 py-2 bg-red-600 text-white text-base font-medium rounded-md w-full shadow-sm hover:bg-red-700 transition duration-150"
              >
                Eliminar
              </button>
              <button
                onClick={handleCloseDeleteModal}
                className="px-4 py-2 bg-gray-300 text-gray-700 text-base font-medium rounded-md w-full shadow-sm hover:bg-gray-400 transition duration-150"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default DriverList;