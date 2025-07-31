import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente DriverList: Muestra la lista de conductores, con opciones para editar y eliminar.
// Recibe setters para los mensajes globales de App.js, y funciones para editar y eliminar.
function DriverList({ onDriverDeleted, onEditDriver, setGlobalMessage, setGlobalError }) {
  // Estados internos para la lista de conductores, carga y errores
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true); // Controla el estado de carga
  const [error, setError] = useState(null);     // Almacena errores de la petición
  const [searchTerm, setSearchTerm] = useState(''); // Estado para el término de búsqueda de conductores

  /**
   * Fetches the list of drivers from the backend API, optionally applying a search filter.
   * @param {string} currentSearchTerm - El término de búsqueda a aplicar.
   */
  const fetchDrivers = async (currentSearchTerm = '') => {
    setLoading(true);
    setError(null);
    setGlobalMessage(''); // Limpia mensajes globales del padre al iniciar una nueva operación
    setGlobalError('');   // Limpia errores globales del padre

    try {
      // Realiza la petición GET a tu backend Flask con el término de búsqueda
      // URL CRÍTICA: Asegúrate de que esta URL sea correcta. Flask debe manejar ?nombre=
      const response = await axios.get(`http://localhost:5000/drivers?nombre=${currentSearchTerm}`);
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.";
      setError(errorMessage); // Establece el error interno de la lista
      setGlobalError(errorMessage); // También propaga el error al estado global del padre
    } finally {
      setLoading(false);
    }
  };

  /**
   * Maneja el cambio en el campo de búsqueda.
   * @param {Object} e - Evento de cambio del input.
   */
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
    // Podrías añadir un debounce aquí si quieres evitar muchas peticiones al escribir.
  };

  /**
   * Maneja el envío del formulario de búsqueda.
   * @param {Object} e - Evento de envío del formulario.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página
    fetchDrivers(searchTerm); // Realiza la búsqueda con el término actual
  };

  /**
   * Handles the deletion of a driver.
   * @param {string} driverId - The ID of the driver to delete.
   */
  const handleDelete = async (driverId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor de forma permanente?')) {
      try {
        await axios.delete(`http://localhost:5000/drivers/${driverId}`);
        setGlobalMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        setGlobalError('');
        
        // Vuelve a cargar la lista de conductores después de la eliminación exitosa
        fetchDrivers(searchTerm); // Recarga aplicando el filtro actual
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar conductor con ID ${driverId}.`;
        setGlobalError(errorMessage);
        setGlobalMessage('');
      }
    }
  };

  // useEffect se ejecuta una vez al montar el componente para cargar los datos iniciales.
  // Se recarga si la 'key' del componente padre cambia (no es necesario aquí si fetchDrivers
  // se llama directamente con filtros o desde el padre).
  useEffect(() => {
    fetchDrivers(); // Carga todos los conductores al inicio
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar

  // --- Renderizado Condicional de la Lista ---
  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando conductores...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    // Contenedor principal de la lista con estilos Tailwind
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-xl bg-white w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Conductores</h2>

      {/* Sección de Búsqueda */}
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
          
      {/* Mensaje si no hay conductores o después de búsqueda */}
      {drivers.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay conductores disponibles o no coinciden con la búsqueda. ¡Crea uno!</p>
      ) : (
        // Lista de conductores
        <ul className="list-none p-0">
          {drivers.map(driver => (
            <li key={driver.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col">
              <div className="mb-3 text-gray-700 leading-relaxed">
                <p><strong className="text-blue-600">Nombre:</strong> {driver.nombre}</p>
                <p><strong className="text-blue-600">Teléfono:</strong> {driver.telefono}</p>
                <p><strong className="text-blue-600">Vehículo:</strong> {driver.tipoVehiculo}</p>
                <p className="text-xs text-gray-400 mt-1">ID: {driver.id}</p>
              </div>
              {/* Botones de acción (Editar/Eliminar) */}
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
