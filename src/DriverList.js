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
    setLoading(true);
    setError(null);
    setDeleteMessage(''); // Limpia mensajes de eliminación al cargar
    try {
      const response = await axios.get('http://127.0.0.1:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      setError("Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.");
    } finally {
      setLoading(false);
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
    return <p style={{ textAlign: 'center', color: '#555' }}>Cargando conductores...</p>;
  }

  if (error) {
    return <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>;
  }

  return (
    <div style={{ flex: 1, padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px', fontSize: '1.8em' }}>Lista de Conductores</h2>
      {deleteMessage && (
        <p style={{ color: deleteMessage.includes('Error') ? 'red' : 'green', textAlign: 'center', marginBottom: '15px' }}>
          {deleteMessage}
        </p>
      )}
      {drivers.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#777', fontStyle: 'italic' }}>No hay conductores disponibles.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {drivers.map(driver => (
            <li key={driver.id} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#fdfdfd', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)', display: 'flex', flexDirection: 'column' }}>
              <div style={{ marginBottom: '10px' }}>
                <strong style={{ color: '#007bff' }}>Nombre:</strong> {driver.nombre} <br />
                <strong style={{ color: '#007bff' }}>Teléfono:</strong> {driver.telefono} <br />
                <strong style={{ color: '#007bff' }}>Tipo de Vehículo:</strong> {driver.tipoVehiculo}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: 'auto' }}>
                {/* Botón de Editar (funcionalidad se implementará en el siguiente paso) */}
                <button
                  onClick={() => onEditDriver(driver)} // Llama a la función del padre para editar
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#ffc107', // Amarillo para editar
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    flexGrow: 1
                  }}
                >
                  Editar
                </button>
                {/* Botón de Eliminar */}
                <button
                  onClick={() => handleDelete(driver.id)}
                  style={{
                    padding: '8px 12px',
                    backgroundColor: '#dc3545', // Rojo para eliminar
                    color: 'white',
                    border: 'none',
                    borderRadius: '5px',
                    cursor: 'pointer',
                    fontSize: '0.9em',
                    flexGrow: 1
                  }}
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