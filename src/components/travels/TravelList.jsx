import React, { useState, useEffect, useCallback } from 'react'; // Importa useCallback
import axios from 'axios';

// Componente TravelList: Muestra la lista de viajes, con opciones para editar y eliminar,
// y campos para búsqueda y filtrado por estado.
// Recibe setters para los mensajes globales de App.js, y funciones para editar y eliminar viajes.
function TravelList({ onEditTravel, onTravelDeleted, setGlobalMessage, setGlobalError }) {
  // Estados internos para la lista de viajes, carga y errores
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pasajeroSearchTerm, setPasajeroSearchTerm] = useState(''); // Estado para el término de búsqueda de pasajero
  const [statusFilter, setStatusFilter] = useState(''); // Estado para el filtro por estado

  /**
   * Fetches the list of travels from the backend API, optionally applying search and status filters.
   * Esta función está envuelta en `useCallback` para asegurar que no cambie en cada render
   * a menos que sus dependencias cambien, lo cual es crucial para `useEffect`.
   * @param {string} currentPasajeroSearchTerm - El término de búsqueda por nombre de pasajero.
   * @param {string} currentStatusFilter - El estado del viaje por el cual filtrar.
   */
  const fetchTravels = useCallback(async (currentPasajeroSearchTerm = '', currentStatusFilter = '') => {
    setLoading(true);
    setError(null);
    setGlobalMessage(''); // Limpia mensajes globales del padre al iniciar una nueva operación
    setGlobalError('');   // Limpia errores globales del padre

    try {
      // Construye los parámetros de la URL para el filtrado
      const params = new URLSearchParams();
      if (currentPasajeroSearchTerm) {
        params.append('pasajero_nombre', currentPasajeroSearchTerm);
      }
      if (currentStatusFilter) {
        params.append('estado', currentStatusFilter);
      }

      // Realiza la petición GET a tu backend Flask con los filtros
      // URL CRÍTICA: Asegúrate de que esta URL sea la correcta y apunte a tu backend Flask.
      const response = await axios.get(`http://localhost:5000/viajes?${params.toString()}`);
      setTravels(response.data);
    } catch (err) {
      console.error("Error al obtener viajes:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los viajes. Asegúrate de que el backend esté funcionando y sea accesible.";
      setError(errorMessage);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [setLoading, setError, setGlobalMessage, setGlobalError, setTravels]); // Dependencias para useCallback

  /**
   * Maneja el cambio en el campo de búsqueda por pasajero.
   * @param {Object} e - Evento de cambio del input.
   */
  const handlePasajeroSearchChange = (e) => {
    setPasajeroSearchTerm(e.target.value);
  };

  /**
   * Maneja el cambio en el filtro por estado.
   * @param {Object} e - Evento de cambio del select.
   */
  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    // Dispara la búsqueda inmediatamente al cambiar el filtro de estado
    fetchTravels(pasajeroSearchTerm, newStatus);
  };

  /**
   * Maneja el envío del formulario de búsqueda por pasajero.
   * @param {Object} e - Evento de envío del formulario.
   */
  const handleSearchSubmit = (e) => {
    e.preventDefault(); // Evita que el formulario recargue la página
    fetchTravels(pasajeroSearchTerm, statusFilter); // Realiza la búsqueda con los términos actuales
  };

  /**
   * Handles the deletion of a travel.
   * @param {string} travelId - The ID of the travel to delete.
   */
  const handleDelete = async (travelId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este viaje de forma permanente?')) {
      try {
        await axios.delete(`http://localhost:5000/viajes/${travelId}`);
        setGlobalMessage(`Viaje con ID ${travelId} eliminado exitosamente.`);
        setGlobalError('');
        
        // Vuelve a cargar la lista de viajes después de la eliminación exitosa
        fetchTravels(pasajeroSearchTerm, statusFilter);
        // Notifica al componente padre que un viaje fue eliminado, para que App.js pueda forzar un refresh si lo necesita.
        if (onTravelDeleted) {
          onTravelDeleted();
        }
      } catch (err) {
        console.error("Error al eliminar viaje:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar viaje con ID ${travelId}.`;
        setGlobalError(errorMessage);
        setGlobalMessage('');
      }
    }
  };

  // useEffect se ejecuta una vez al montar el componente para cargar los datos iniciales.
  // La función `fetchTravels` se incluye en el array de dependencias porque es una función memoizada.
  useEffect(() => {
    fetchTravels(); // Carga todos los viajes al inicio
  }, [fetchTravels]); // ¡CORRECCIÓN! Añadida fetchTravels como dependencia para evitar la advertencia

  // --- Renderizado Condicional de la Lista ---
  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando viajes...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    // Contenedor principal de la lista de viajes con estilos Tailwind
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-xl bg-white w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Viajes</h2>

      {/* Sección de Búsqueda y Filtro */}
      <form onSubmit={handleSearchSubmit} className="mb-6 flex flex-col sm:flex-row gap-2">
        <input
          type="text"
          placeholder="Buscar por pasajero..."
          value={pasajeroSearchTerm}
          onChange={handlePasajeroSearchChange}
          className="flex-1 shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-purple-500"
        />
        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="flex-1 shadow border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-purple-500"
        >
          <option value="">Filtrar por Estado (Todos)</option>
          <option value="pendiente">Pendiente</option>
          <option value="asignado">Asignado</option>
          <option value="en_curso">En Curso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
        <button
          type="submit"
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out hidden sm:block"
          // Ocultar en pantallas pequeñas si solo hay dos campos y el select ya dispara el filtro
        >
          Buscar
        </button>
      </form>
          
      {/* Mensaje si no hay viajes o después de búsqueda */}
      {travels.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay viajes registrados o no coinciden con la búsqueda/filtro. ¡Crea uno!</p>
      ) : (
        // Lista de viajes
        <ul className="list-none p-0">
          {travels.map(travel => (
            <li key={travel.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col">
              <div className="mb-3 text-gray-700 leading-relaxed">
                <p><strong className="text-purple-600">Pasajero:</strong> {travel.pasajero_nombre}</p>
                <p><strong className="text-purple-600">Teléfono:</strong> {travel.pasajero_telefono || 'N/A'}</p>
                <p><strong className="text-purple-600">Origen (Texto):</strong> {travel.ubicacion_origen_texto || 'N/A'}</p>
                {travel.ubicacion_origen_lat && travel.ubicacion_origen_lon && (
                  <p><strong className="text-purple-600">Origen (GPS):</strong> {travel.ubicacion_origen_lat}, {travel.ubicacion_origen_lon}</p>
                )}
                {travel.ubicacion_destino_texto && (
                  <p><strong className="text-purple-600">Destino (Texto):</strong> {travel.ubicacion_destino_texto}</p>
                )}
                {travel.ubicacion_destino_lat && travel.ubicacion_destino_lon && (
                  <p><strong className="text-purple-600">Destino (GPS):</strong> {travel.ubicacion_destino_lat}, {travel.ubicacion_destino_lon}</p>
                )}
                <p><strong className="text-purple-600">Estado:</strong> <span className={`font-semibold ${travel.estado === 'pendiente' ? 'text-orange-500' : 'text-blue-500'}`}>{travel.estado}</span></p>
                {travel.conductor_nombre && (
                  <p><strong className="text-purple-600">Conductor Asignado:</strong> {travel.conductor_nombre}</p>
                )}
                {travel.fecha_solicitud && (
                  // Asegúrate de que fecha_solicitud sea un objeto de fecha válido o una cadena parseable
                  <p><strong className="text-purple-600">Solicitado:</strong> {new Date(travel.fecha_solicitud).toLocaleString()}</p>
                )}
                {travel.fecha_asignacion && (
                  <p><strong className="text-purple-600">Asignado:</strong> {new Date(travel.fecha_asignacion).toLocaleString()}</p>
                )}
                {travel.notas && (
                  <p><strong className="text-purple-600">Notas:</strong> {travel.notas}</p>
                )}
              </div>
              {/* Botones de acción (Editar/Eliminar) */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => onEditTravel(travel)}
                  className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(travel.id)}
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

export default TravelList;
