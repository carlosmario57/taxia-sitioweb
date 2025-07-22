import React, { useState, useEffect } from 'react';
import axios from 'axios';

// DriverList ahora recibe una prop 'onDriverDeleted' para notificar al padre
// cuando un conductor es eliminado, y 'onEditDriver' para iniciar la edición.
function DriverList({ onDriverDeleted, onEditDriver }) {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState(''); // Estado para mensajes de eliminación

  // Función para obtener los conductores
  const fetchDrivers = async () => {
    setLoading(true); // Reinicia el estado de carga antes de cada petición
    setError(null);    // Limpia errores anteriores
    setDeleteMessage(''); // Limpia mensajes de eliminación al cargar
    try {
      const response = await axios.get('http://127.0.0.1:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      // Mensaje más amigable para el usuario
      setError("Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.");
    } finally {
      setLoading(false); // Deja de mostrar el indicador de carga, tanto si hubo éxito como error
    }
  };

  // Función para manejar la eliminación de un conductor
  const handleDelete = async (driverId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor?')) { // Confirmación de seguridad
      try {
        await axios.delete(`http://127.0.0.1:5000/drivers/${driverId}`);
        setDeleteMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        // Llama a la función del padre para que la lista se actualice
        if (onDriverDeleted) {
          onDriverDeleted();
        }
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        setDeleteMessage(`Error al eliminar conductor con ID ${driverId}.`);
      }
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []); // Se ejecuta solo una vez al montar, y se recarga si la 'key' del componente padre cambia

  if (loading) {
    return <p className="text-center text-gray-600">Cargando conductores...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center font-bold">{error}</p>;
  }

  return (
    // Contenedor principal de la lista con estilos Tailwind
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Conductores</h2>
      {deleteMessage && (
        <p className={`text-center mb-4 ${deleteMessage.includes('Error') ? 'text-red-500' : 'text-green-500'}`}>
          {deleteMessage}
        </p>
      )}
      {drivers.length === 0 ? (
        <p className="text-center text-gray-500 italic">No hay conductores disponibles.</p>
      ) : (
        <ul className="list-none p-0">
          {drivers.map(driver => (
            <li key={driver.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col">
              <div className="mb-2 text-gray-700">
                <strong className="text-blue-600">Nombre:</strong> {driver.nombre} <br />
                <strong className="text-blue-600">Teléfono:</strong> {driver.telefono} <br />
                <strong className="text-blue-600">Tipo de Vehículo:</strong> {driver.tipoVehiculo}
              </div>
              <div className="flex gap-2 mt-auto">
                {/* Botón de Editar */}
                <button
                  onClick={() => onEditDriver(driver)} // Llama a la función del padre para editar
                  className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm"
                >
                  Editar
                </button>
                {/* Botón de Eliminar */}
                <button
                  onClick={() => handleDelete(driver.id)}
                  className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm"
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