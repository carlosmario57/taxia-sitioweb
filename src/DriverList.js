import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import axios from 'axios';

function DriverList({ onDriverDeleted, onEditDriver }) {
  const [drivers, setDrivers] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [deleteMessage, setDeleteMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null); // Track which driver is being deleted

  const fetchDrivers = async () => {
    setLoading(true);
    setError(null);
    setDeleteMessage('');
    
    try {
      const response = await axios.get('http://localhost:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      setError("Error al cargar los conductores. Por favor, verifica la conexión al servidor.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (driverId) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar este conductor?')) {
      return;
    }

    setDeletingId(driverId);
    setDeleteMessage('');

    try {
      await axios.delete(`http://localhost:5000/drivers/${driverId}`);
      setDeleteMessage('Conductor eliminado exitosamente.');
      
      // Actualizar la lista y notificar al padre
      await fetchDrivers();
      if (onDriverDeleted) {
        onDriverDeleted();
      }
    } catch (err) {
      const errorMessage = err.response?.data?.error || 'Error al eliminar el conductor.';
      setDeleteMessage(`Error: ${errorMessage}`);
      console.error("Error al eliminar conductor:", err);
    } finally {
      setDeletingId(null);
    }
  };

  useEffect(() => {
    fetchDrivers();
  }, []);

  if (loading && !drivers.length) {
    return <p className="text-center text-gray-600 p-4">Cargando conductores...</p>;
  }

  if (error) {
    return (
      <div className="text-center p-4">
        <p className="text-red-600 font-bold mb-2">{error}</p>
        <button 
          onClick={fetchDrivers}
          className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded"
        >
          Reintentar
        </button>
      </div>
    );
  }

  return (
    <div className="flex-1 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Conductores</h2>
      
      {deleteMessage && (
        <p className={`text-center mb-4 p-2 rounded ${
          deleteMessage.includes('Error') ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'
        }`}>
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
                  disabled={deletingId === driver.id}
                  className="flex-1 py-2 px-3 bg-yellow-500 hover:bg-yellow-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  Editar
                </button>
                <button
                  onClick={() => handleDelete(driver.id)}
                  disabled={deletingId === driver.id}
                  className="flex-1 py-2 px-3 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-md shadow-sm transition duration-150 ease-in-out text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50 disabled:opacity-50"
                >
                  {deletingId === driver.id ? 'Eliminando...' : 'Eliminar'}
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

DriverList.propTypes = {
  onDriverDeleted: PropTypes.func,
  onEditDriver: PropTypes.func.isRequired
};

export default DriverList;