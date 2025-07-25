import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente DriverList: Muestra la lista de conductores, con opciones para editar y eliminar.
// Recibe props de App.js para el manejo global de estados y mensajes.
function DriverList({ onDriverDeleted, onEditDriver, message, error, setMessage, setError, loading, setLoading }) {
  // Solo necesitamos un estado local para los conductores, los mensajes/errores vienen del padre
  const [drivers, setDrivers] = useState([]);

  // Efecto para cargar los conductores al montar el componente
  useEffect(() => {
    fetchDrivers();
  }, []);

  // Función para obtener la lista de conductores
  const fetchDrivers = async () => {
    setLoading(true);
    try {
      const response = await axios.get('http://localhost:3001/api/drivers');
      setDrivers(response.data);
      setError('');
    } catch (err) {
      setError('Error al cargar los conductores');
      console.error('Error fetching drivers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Función para eliminar un conductor
  const handleDelete = async (id) => {
    if (window.confirm('¿Está seguro de eliminar este conductor?')) {
      setLoading(true);
      try {
        await axios.delete(`http://localhost:3001/api/drivers/${id}`);
        setDrivers(drivers.filter(driver => driver.id !== id));
        setMessage('Conductor eliminado exitosamente');
        onDriverDeleted();
      } catch (err) {
        setError('Error al eliminar el conductor');
        console.error('Error deleting driver:', err);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div className="container mt-4">
      <h2>Lista de Conductores</h2>
      {loading && <p>Cargando...</p>}
      {error && <div className="alert alert-danger">{error}</div>}
      {message && <div className="alert alert-success">{message}</div>}
      
      <table className="table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Apellido</th>
            <th>Licencia</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {drivers.map(driver => (
            <tr key={driver.id}>
              <td>{driver.id}</td>
              <td>{driver.nombre}</td>
              <td>{driver.apellido}</td>
              <td>{driver.licencia}</td>
              <td>
                <button 
                  className="btn btn-primary me-2"
                  onClick={() => onEditDriver(driver)}
                >
                  Editar
                </button>
                <button 
                  className="btn btn-danger"
                  onClick={() => handleDelete(driver.id)}
                >
                  Eliminar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default DriverList;