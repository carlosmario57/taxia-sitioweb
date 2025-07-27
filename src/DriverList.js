import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente DriverList: Muestra la lista de conductores, con opciones para editar, eliminar y búsqueda.
// Recibe props de App.js para el manejo global de estados y mensajes, y funciones de acción.
function DriverList({ onDriverDeleted, onEditDriver, setGlobalMessage, setGlobalError }) {
  // ESTADOS INTERNOS de DriverList para la data, carga y errores de la lista misma.
  const [drivers, setDrivers] = useState([]);
  const [loading, setLoading] = useState(true); // Estado de carga interno para la lista
  const [error, setError] = useState(null);     // Estado de error interno para la lista
  const [deleteMessage, setDeleteMessage] = useState(''); // Estado para mensajes de eliminación (por si la eliminación falla, el mensaje sea más local)

  // Nuevo estado para el término de búsqueda
  const [searchTerm, setSearchTerm] = useState('');

  /**
   * Fetches the list of drivers from the backend API.
   * Accepts an optional searchTerm to filter results.
   */
  const fetchDrivers = async (term = '') => { // Acepta un término de búsqueda opcional
    setLoading(true); // Controla la carga internamente
    setError(null);    // Limpia error interno
    setDeleteMessage(''); // Limpia mensajes de eliminación anteriores

    // No limpiamos los mensajes globales aquí, ya que la búsqueda no es una operación de CRUD
    // principal que genere un mensaje global de éxito/error.

    try {
      // Construye la URL con el parámetro de búsqueda si existe
      // ¡IMPORTANTE! Asegúrate de que esta URL sea la correcta para tu backend Flask (http://localhost:5000/drivers)
      const url = term ? `http://localhost:5000/drivers?nombre=${term}` : 'http://localhost:5000/drivers';
      const response = await axios.get(url); // Usa la URL con o sin filtro
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
        // ¡IMPORTANTE! Asegúrate de que esta URL sea la correcta para tu backend Flask
        await axios.delete(`http://localhost:5000/drivers/${driverId}`);
        setDeleteMessage(`Conductor con ID ${driverId} eliminado exitosamente.`); // Mensaje local para eliminación
        setGlobalMessage(`Conductor con ID ${driverId} eliminado exitosamente.`); // Mensaje global de éxito
        setGlobalError(''); // Limpia cualquier error global anterior
        
        // Vuelve a cargar la lista de conductores después de la eliminación exitosa, manteniendo el filtro actual
        fetchDrivers(searchTerm);
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar conductor con ID ${driverId}.`;
        setDeleteMessage(errorMessage); // Mensaje de error local
        setGlobalError(errorMessage); // Propaga el error al estado global
        setGlobalMessage(''); // Limpia el mensaje de éxito global si hay un error
      }
    }
  };

  // Función para manejar el clic en el botón de búsqueda
  const handleSearch = () => {
    fetchDrivers(searchTerm); // Llama a fetchDrivers con el término actual del input
  };

  // Cargar conductores al montar el componente (sin término inicial)
  useEffect(() => {
    fetchDrivers();
  }, []); // Se ejecuta solo una vez al montar

  // Renderizado Condicional
  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando conductores...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    // Contenedor principal de la lista con estilos Tailwind
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Conductores</h2>

      {/* Campo de búsqueda */}
      <div className="mb-4 flex gap-2">
        <input
          type="text"
          placeholder="Buscar por nombre..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <button
          onClick={handleSearch}
          className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-sm"
        >
          Buscar
        </button>
      </div>

      {deleteMessage && (
        <p className={`text-center mb-4 p-2 rounded ${deleteMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {deleteMessage}
        </p>
      )}

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
