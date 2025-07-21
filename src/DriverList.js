import React, { useState, useEffect } from 'react';
import axios from 'axios';

// El componente DriverList ahora recibe una prop 'key' para forzar su recarga
// (aunque React usa 'key' internamente, al cambiarla, el componente se remonta,
// lo que dispara el useEffect de nuevo).
function DriverList() {
  // Estado para almacenar la lista de conductores
  const [drivers, setDrivers] = useState([]);
  // Estado para manejar errores en la petición
  const [error, setError] = useState(null);
  // Estado para indicar si los datos están cargando
  const [loading, setLoading] = useState(true);

  // Función asíncrona para obtener los conductores
  const fetchDrivers = async () => {
    setLoading(true); // Reinicia el estado de carga antes de cada petición
    setError(null);    // Limpia errores anteriores
    try {
      // Realiza la petición GET a tu backend Flask
      // Asegúrate de que tu backend Flask esté corriendo en http://127.0.0.1:5000
      const response = await axios.get('http://127.0.0.1:5000/drivers');
      setDrivers(response.data); // Actualiza el estado con los datos de los conductores
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      // Mensaje más amigable para el usuario
      setError("Error al cargar los conductores. Asegúrate de que el backend esté funcionando y sea accesible.");
    } finally {
      setLoading(false); // Deja de mostrar el indicador de carga, tanto si hubo éxito como error
    }
  };

  useEffect(() => {
    // Llama a la función para obtener los conductores cuando el componente se monta
    // o cuando la prop 'key' (que se usa para forzar la recarga) cambia.
    fetchDrivers();
  }, [/* No necesitamos poner 'key' aquí explícitamente, ya que React maneja la remoción/remontaje */]);
  // El hecho de que la 'key' en App.js cambie hará que este componente DriverList
  // se desmonte y se monte de nuevo, lo que a su vez ejecutará este useEffect.

  // Muestra un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return <p style={{ textAlign: 'center', color: '#555' }}>Cargando conductores...</p>;
  }

  // Muestra un mensaje de error si algo salió mal
  if (error) {
    return <p style={{ color: 'red', textAlign: 'center', fontWeight: 'bold' }}>{error}</p>;
  }

  // Renderiza la lista de conductores
  return (
    <div style={{ flex: 1, padding: '20px', border: '1px solid #e0e0e0', borderRadius: '8px', backgroundColor: '#fff', boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)' }}>
      <h2 style={{ textAlign: 'center', color: '#333', marginBottom: '20px', fontSize: '1.8em' }}>Lista de Conductores</h2>
      {drivers.length === 0 ? (
        <p style={{ textAlign: 'center', color: '#777', fontStyle: 'italic' }}>No hay conductores disponibles.</p>
      ) : (
        <ul style={{ listStyle: 'none', padding: 0 }}>
          {drivers.map(driver => (
            <li key={driver.id} style={{ marginBottom: '15px', padding: '15px', border: '1px solid #eee', borderRadius: '6px', backgroundColor: '#fdfdfd', boxShadow: '0 1px 4px rgba(0, 0, 0, 0.03)' }}>
              <strong style={{ color: '#007bff' }}>Nombre:</strong> {driver.nombre} <br />
              <strong style={{ color: '#007bff' }}>Teléfono:</strong> {driver.telefono} <br />
              <strong style={{ color: '#007bff' }}>Tipo de Vehículo:</strong> {driver.tipoVehiculo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DriverList;