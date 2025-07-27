import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente TravelList: Muestra la lista de viajes, con opciones para editar, eliminar y asignar conductor, y filtros.
// Recibe setters para los mensajes globales de App.js y funciones de acción.
function TravelList({ onEditTravel, onTravelDeleted, onAssignDriver, setGlobalMessage, setGlobalError }) {
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Nuevos estados para los filtros de viajes
  const [pasajeroSearchTerm, setPasajeroSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // 'pendiente', 'asignado', 'completado', etc.

  /**
   * Fetches the list of travels from the backend API.
   * Accepts optional filter parameters.
   */
  const fetchTravels = async (pasajeroTerm = '', status = '') => {
    setLoading(true);
    setError(null);
    setGlobalMessage('');
    setGlobalError('');

    try {
      // Construye la URL con los parámetros de búsqueda y filtro de estado
      const params = new URLSearchParams();
      if (pasajeroTerm) {
        params.append('pasajero_nombre', pasajeroTerm);
      }
      if (status) {
        params.append('estado', status);
      }
      
      // ¡IMPORTANTE! Asegúrate de que esta URL sea la correcta para tu backend Flask
      const url = `http://localhost:5000/viajes?${params.toString()}`;
      const response = await axios.get(url);
      setTravels(response.data);
    } catch (err) {
      console.error("Error al obtener viajes:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los viajes. Asegúrate de que el backend esté funcionando y sea accesible.";
      setError(errorMessage);
      setGlobalError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handles the deletion of a travel.
   * @param {string} travelId - The ID of the travel to delete.
   */
  const handleDelete = async (travelId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este viaje de forma permanente?')) {
      try {
        // ¡IMPORTANTE! Asegúrate de que esta URL sea la correcta para tu backend Flask
        await axios.delete(`http://localhost:5000/viajes/${travelId}`);
        setGlobalMessage(`Viaje con ID ${travelId} eliminado exitosamente.`);
        setGlobalError('');
        fetchTravels(pasajeroSearchTerm, statusFilter); // Recarga la lista con los filtros actuales
      } catch (err) {
        console.error("Error al eliminar viaje:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar viaje con ID ${travelId}.`;
        setGlobalError(errorMessage);
        setGlobalMessage('');
      }
    }
  };

  // Maneja la búsqueda por nombre de pasajero
  const handleSearchPasajero = () => {
    fetchTravels(pasajeroSearchTerm, statusFilter);
  };

  // Maneja el cambio de filtro por estado
  const handleStatusFilterChange = (e) => {
    const newStatus = e.target.value;
    setStatusFilter(newStatus);
    fetchTravels(pasajeroSearchTerm, newStatus); // Inicia la búsqueda inmediatamente
  };

  // Cargar viajes al montar el componente (sin filtros iniciales)
  useEffect(() => {
    fetchTravels();
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando viajes...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Viajes</h2>

      {/* Campos de filtro de viajes */}
      <div className="mb-4 flex flex-col gap-2">
        <input
          type="text"
          placeholder="Buscar por pasajero..."
          value={pasajeroSearchTerm}
          onChange={(e) => setPasajeroSearchTerm(e.target.value)}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
        />
        <button
          onClick={handleSearchPasajero}
          className="bg-purple-500 hover:bg-purple-600 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out text-sm"
        >
          Buscar Viajes
        </button>
        <select
          value={statusFilter}
          onChange={handleStatusFilterChange}
          className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 mt-2"
        >
          <option value="">Filtrar por Estado (Todos)</option>
          <option value="pendiente">Pendiente</option>
          <option value="asignado">Asignado</option>
          <option value="en_curso">En Curso</option>
          <option value="completado">Completado</option>
          <option value="cancelado">Cancelado</option>
        </select>
      </div>

      {travels.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay viajes que coincidan con la búsqueda.</p>
      ) : (
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
                <p><strong className="text-purple-600">Destino (Texto):</strong> {travel.ubicacion_destino_texto || 'N/A'}</p>
                {travel.ubicacion_destino_lat && travel.ubicacion_destino_lon && (
                  <p><strong className="text-purple-600">Destino (GPS):</strong> {travel.ubicacion_destino_lat}, {travel.ubicacion_destino_lon}</p>
                )}
                <p><strong className="text-purple-600">Estado:</strong> <span className={`font-semibold ${travel.estado === 'pendiente' ? 'text-orange-500' : travel.estado === 'asignado' ? 'text-blue-500' : 'text-green-500'}`}>{travel.estado}</span></p>
                {travel.conductor_nombre && (
                  <p><strong className="text-purple-600">Conductor Asignado:</strong> {travel.conductor_nombre}</p>
                )}
                {travel.fecha_solicitud && (
                  <p><strong className="text-purple-600">Solicitado:</strong> {new Date(travel.fecha_solicitud).toLocaleString()}</p>
                )}
                {travel.fecha_asignacion && (
                  <p><strong className="text-purple-600">Asignado:</strong> {new Date(travel.fecha_asignacion).toLocaleString()}</p>
                )}
                {travel.notas && (
                  <p><strong className="text-purple-600">Notas:</strong> {travel.notas}</p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 mt-auto">
                {travel.estado === 'pendiente' && !travel.conductor_id && (
                  <button
                    onClick={() => onAssignDriver(travel)}
                    className="flex-1 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-opacity-50"
                  >
                    Asignar Conductor
                  </button>
                )}
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