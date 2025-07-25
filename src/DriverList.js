import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente DriverList: Muestra la lista de conductores, con opciones para editar y eliminar.
// Recibe:
// - onDriverDeleted: Función para notificar al padre cuando un conductor es eliminado.
// - onEditDriver: Función para notificar al padre qué conductor se va a editar.
function DriverList({ onDriverDeleted, onEditDriver }) {
  // Estado para almacenar la lista de conductores
  const [drivers, setDrivers] = useState([]);
  // Estado para manejar errores en la petición
  const [error, setError] = useState(null);
  // Estado para indicar si los datos están cargando
  const [loading, setLoading] = useState(true);
  // Estado para mensajes temporales después de una eliminación
  const [deleteMessage, setDeleteMessage] = useState('');

  /**
   * Fetches the list of drivers from the backend API.
   * Resets loading, error, and delete messages before fetching.
   */
  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    setDeleteMessage(''); // Limpia mensajes de eliminación al cargar
    try {
      // Realiza la petición GET a tu backend Flask
      // URL CRÍTICA: Asegúrate de que esta URL sea la correcta y coincida con tu backend.
      const response = await axios.get('http://localhost:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      // Mensaje más descriptivo para el usuario.
      setError("Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.");
    } finally {
      setLoading(false); // Siempre deja de cargar, sin importar el resultado.
    }
  };

  /**
   * Handles the deletion of a driver.
   * @param {string} driverId - The ID of the driver to delete.
   */
  const handleDelete = async (driverId) => {
    // Confirmación visual antes de eliminar (puedes usar un modal más bonito en el futuro)
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor de forma permanente?')) {
      try {
        // Realiza la petición DELETE a tu backend Flask
        // URL CRÍTICA: Asegúrate de que esta URL sea la correcta.
        await axios.delete(`http://localhost:5000/drivers/${driverId}`);
        setDeleteMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        
        // Notifica al componente padre para que recargue la lista
        if (onDriverDeleted) {
          onDriverDeleted();
        }
        // Recarga la lista localmente
        fetchDrivers();
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        // Mensaje de error detallado desde el backend si está disponible.
        const errorMessage = err.response?.data?.error || `Error al eliminar conductor con ID ${driverId}.`;
        setDeleteMessage(errorMessage);
      }
    }
  };

  // useEffect se ejecuta una vez al montar el componente para cargar los datos.
  // Si la 'key' del componente padre cambia, React lo remonta y este efecto se dispara de nuevo.
  useEffect(() => {
    fetchDrivers();
  }, []);

  // --- Renderizado Condicional ---
  if (loading) {
    return <p className="text-center text-gray-600 p-4">Cargando conductores...</p>;
  }

  if (error) {
    return <p className="text-red-600 text-center font-bold p-4">{error}</p>;
  }

  return (
    // Contenedor principal de la lista de conductores con estilos Tailwind
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Conductores</h2>
      {/* Mensaje de éxito/error de eliminación */}
      {deleteMessage && (
        <p className={`text-center mb-4 p-2 rounded ${deleteMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}`}>
          {deleteMessage}
        </p>
      )}
      {/* Mensaje si no hay conductores */}
      {drivers.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay conductores disponibles. ¡Crea uno!</p>
      ) : (
        // Lista de conductores
        <ul className="list-none p-0">
          {drivers.map(driver => (
            <li key={driver.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col">
              <div className="mb-3 text-gray-700 leading-relaxed">
                <p><strong className="text-blue-600">Nombre:</strong> {driver.nombre}</p>
                <p><strong className="text-blue-600">Teléfono:</strong> {driver.telefono}</p>
                <p><strong className="text-blue-600">Vehículo:</strong> {driver.tipoVehiculo}</p>
                {/* Puedes añadir más detalles del conductor aquí */}
                <p className="text-xs text-gray-400 mt-1">ID: {driver.id}</p>
              </div>
              {/* Botones de acción (Editar/Eliminar) */}
              <div className="flex gap-2 mt-auto">
                <button
                  onClick={() => onEditDriver(driver)} // Llama a la función del padre para editar
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