import React, { useState, useEffect } from 'react';
import axios from 'axios';

function DriverList() {
  // Estado para almacenar la lista de conductores
  const [drivers, setDrivers] = useState([]);
  // Estado para manejar errores en la petición
  const [error, setError] = useState(null);
  // Estado para indicar si los datos están cargando
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Función asíncrona para obtener los conductores
    const fetchDrivers = async () => {
      try {
        // Realiza la petición GET a tu backend Flask
        // Asegúrate de que tu backend Flask esté corriendo en http://127.0.0.1:5000
        const response = await axios.get('http://127.0.0.1:5000/drivers');
        setDrivers(response.data); // Actualiza el estado con los datos de los conductores
        setLoading(false); // Deja de mostrar el indicador de carga
      } catch (err) {
        console.error("Error al obtener conductores:", err);
        setError("Error al cargar los conductores. Asegúrate de que el backend esté funcionando."); // Establece el mensaje de error
        setLoading(false); // Deja de mostrar el indicador de carga
      }
    };

    fetchDrivers(); // Llama a la función para obtener los conductores cuando el componente se monta
  }, []); // El array vacío asegura que este efecto se ejecute solo una vez al montar el componente

  // Muestra un mensaje de carga mientras se obtienen los datos
  if (loading) {
    return <p>Cargando conductores...</p>;
  }

  // Muestra un mensaje de error si algo salió mal
  if (error) {
    return <p style={{ color: 'red' }}>{error}</p>;
  }

  // Renderiza la lista de conductores
  return (
    <div>
      <h2>Lista de Conductores</h2>
      {drivers.length === 0 ? (
        <p>No hay conductores disponibles.</p>
      ) : (
        <ul>
          {drivers.map(driver => (
            <li key={driver.id}>
              <strong>Nombre:</strong> {driver.nombre} <br />
              <strong>Teléfono:</strong> {driver.telefono} <br />
              <strong>Tipo de Vehículo:</strong> {driver.tipoVehiculo}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default DriverList;