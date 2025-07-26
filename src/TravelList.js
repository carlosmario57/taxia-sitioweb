import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente TravelList: Muestra la lista de viajes, con opciones para editar y eliminar.
// Recibe setters para los mensajes globales de App.js y funciones de acción.
function TravelList({ onEditTravel, onTravelDeleted, setGlobalMessage, setGlobalError }) {
  // Estados INTERNOS de TravelList para la data, carga y errores
  const [travels, setTravels] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Fetches the list of travels from the backend API.
   * Resets loading and error states before fetching.
   */
  const fetchTravels = async () => {
    setLoading(true);
    setError(null);
    setGlobalMessage(''); // Limpia mensajes globales
    setGlobalError('');   // Limpia errores globales

    try {
      const response = await axios.get('http://localhost:5000/viajes');
      setTravels(response.data);
    } catch (err) {
      console.error("Error al obtener viajes:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los viajes. Asegúrate de que el backend esté funcionando y sea accesible.";
      setError(errorMessage);
      setGlobalError(errorMessage); // Propaga el error al estado global
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
        await axios.delete(`http://localhost:5000/viajes/${travelId}`);
        setGlobalMessage(`Viaje con ID ${travelId} eliminado exitosamente.`);
        setGlobalError('');
        fetchTravels(); // Vuelve a cargar la lista de viajes después de la eliminación
      } catch (err) {
        console.error("Error al eliminar viaje:", err);
        const errorMessage = err.response?.data?.error || `Error al eliminar viaje con ID ${travelId}.`;
        setGlobalError(errorMessage);
        setGlobalMessage('');
      }
    }
  };

  // Cargar viajes al montar el componente
  useEffect(() => {
    fetchTravels();
  }, [setGlobalMessage, setGlobalError, onTravelDeleted]); // Dependencias para que se ejecute si los setters globales o la función de eliminación cambian

  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando viajes...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Viajes</h2>
      {travels.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay viajes registrados aún.</p>
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
                  <p><strong className="text-purple-600">Solicitado:</strong> {new Date(travel.fecha_solicitud).toLocaleString()}</p>
                )}
                {travel.fecha_asignacion && (
                  <p><strong className="text-purple-600">Asignado:</strong> {new Date(travel.fecha_asignacion).toLocaleString()}</p>
                )}
                {travel.notas && (
                  <p><strong className="text-purple-600">Notas:</strong> {travel.notas}</p>
                )}
              </div>
              {/* Botones de acción (Editar/Eliminar) para Viajes */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => onEditTravel(travel)} // Llama a la función del padre para editar
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
