// Importaciones de React y Axios para peticiones HTTP
import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Componente DriverList: Muestra la lista de conductores, con opciones para editar, eliminar y búsqueda.
function DriverList({ onDriverDeleted, onEditDriver, setGlobalMessage, setGlobalError }) {
  // Estados para gestionar los datos de la lista, el estado de carga y los errores.
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Esta es la función clave para obtener los datos de los conductores del backend.
   * La corrección más importante está aquí.
   * @param {string} currentSearchTerm - El término de búsqueda opcional.
   */
  const fetchDrivers = useCallback(async (currentSearchTerm = '') => {
    setLoading(true);
    setError(null);
    setDeleteMessage('');

    try {
      // CORRECCIÓN MANUAL AQUÍ: La URL debe usar '/drivers', no '/conductores'.
      const url = currentSearchTerm ? `http://localhost:5000/drivers?nombre=${currentSearchTerm}` : 'http://localhost:5000/drivers';
      const response = await axios.get(url);
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.";
      setError(errorMessage);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setGlobalError, setDrivers]);

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
   * Maneja la eliminación de un conductor.
   * La segunda corrección importante está en esta función.
   * @param {string} driverId - El ID del conductor a eliminar.
   */
  const handleDelete = async (driverId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor de forma permanente?')) {
      try {
        // CORRECCIÓN MANUAL AQUÍ: La URL debe usar '/drivers', no '/conductores'.
        await axios.delete(`http://localhost:5000/drivers/${driverId}`);
        setDeleteMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        setGlobalMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        setGlobalError('');
        
        fetchDrivers(searchTerm);
        if (onDriverDeleted) {
          onDriverDeleted();
        }
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar conductor con ID ${driverId}.`;
        setDeleteMessage(errorMessage);
        setGlobalError(errorMessage);
        setGlobalMessage('');
      }
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  // --- Renderizado Condicional de la Lista ---
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
          
      {deleteMessage && (
        <p className={`text-center mb-4 p-2 rounded ${deleteMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {deleteMessage}
        </p>
      )}

      {drivers.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay conductores disponibles o no coinciden con la búsqueda. ¡Crea uno!</p>
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
