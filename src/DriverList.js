import React, { useState, useEffect } from 'react';
import axios from 'axios';

// DriverList recibe 'onDriverDeleted' y 'onEditDriver' como props
function DriverList({ onDriverDeleted, onEditDriver }) {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState('');

  // Obtener conductores desde el backend
  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    setDeleteMessage('');
    try {
      const response = await axios.get('http://localhost:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      setError("Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.");
    } finally {
      setLoading(false);
    }
  };

  // Eliminar conductor
  const handleDelete = async (driverId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor?')) {
      try {
        await axios.delete(`http://localhost:5000/drivers/${driverId}`);
        setDeleteMessage(`Conductor con ID ${driverId} eliminado exitosamente.`);
        if (onDriverDeleted) onDriverDeleted();
        fetchDrivers();
      } catch (err) {
        setDeleteMessage(`Error al eliminar conductor con ID ${driverId}.`);
      }
    }
  };

  useEffect(() => {
    fetchDrivers();
    // eslint-disable-next-line
  }, []);

  if (loading) {
    return <p className="text-center text-gray-600">Cargando conductores...</p>;
  }

  if (error) {
    return <p className="text-red-500 text-center font-bold">{error}</p>;
  }

  return (
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
                <button
                  onClick={() => onEditDriver(driver)}
                  className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm"
                >
                  Editar
                </button>
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