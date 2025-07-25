import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente TravelList: Muestra la lista de viajes.
// Recibe setters para los mensajes globales de App.js.
function TravelList({ setGlobalMessage, setGlobalError }) {
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
    setGlobalMessage(''); // Limpia mensajes globales del padre
    setGlobalError('');   // Limpia errores globales del padre

    try {
      // Realiza la petición GET a tu backend Flask
      // URL CRÍTICA: Asegúrate de que esta URL sea la correcta y apunte a tu backend Flask.
      const response = await axios.get('http://localhost:5000/viajes');
      setTravels(response.data);
    } catch (err) {
      console.error("Error al obtener viajes:", err);
      const errorMessage = err.response?.data?.error || "Error al cargar los viajes. Asegúrate de que el backend esté funcionando y sea accesible.";
      setError(errorMessage); // Establece el error interno
      setGlobalError(errorMessage); // Propaga el error al estado global
    } finally {
      setLoading(false);
    }
  };

  // Cargar viajes al montar el componente
  // Se ejecutará una vez al montar, y puede ser disparado por cambios en App.js
  useEffect(() => {
    fetchTravels();
  }, [setGlobalMessage, setGlobalError]); // Dependencias para que se ejecute si los setters globales cambian

  // Renderizado Condicional para estados de carga y error internos
  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando viajes...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    // Contenedor principal de la lista de viajes con estilos Tailwind
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Viajes</h2>
      {travels.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay viajes registrados aún.</p>
      ) : (
        <ul className="list-none p-0">
          {travels.map(travel => (
            <li key={travel.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col">
              <div className="mb-2 text-gray-700 leading-relaxed">
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
              {/* Aquí puedes añadir botones de Editar/Eliminar para viajes más adelante */}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default TravelList;
