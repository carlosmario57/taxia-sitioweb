import React, { useState } from 'react';
import axios from 'axios';

function DriverForm({ onDriverCreated }) { // onDriverCreated es una función que se pasará desde el componente padre
  // Estados para los campos del formulario
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  // Estados para mensajes de éxito o error
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Función que se ejecuta al enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página)

    setMessage(''); // Limpia mensajes anteriores
    setError('');   // Limpia errores anteriores

    // Validación básica de los campos
    if (!nombre || !telefono || !tipoVehiculo) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    try {
      // Crea un objeto con los datos del nuevo conductor
      const newDriver = {
        nombre,
        telefono,
        tipoVehiculo
      };

      // Realiza la petición POST a tu backend Flask
      // Asegúrate de que tu backend Flask esté corriendo en http://127.0.0.1:5000
      const response = await axios.post('http://127.0.0.1:5000/drivers', newDriver);

      setMessage(`Conductor "${response.data.id}" creado exitosamente.`); // Muestra mensaje de éxito

      // Limpia el formulario después de un envío exitoso
      setNombre('');
      setTelefono('');
      setTipoVehiculo('');

      // Llama a la función onDriverCreated si se proporcionó, para notificar al componente padre
      if (onDriverCreated) {
        onDriverCreated();
      }

    } catch (err) {
      console.error("Error al crear conductor:", err);
      setError("Error al crear el conductor. Asegúrate de que el backend esté funcionando y los datos sean válidos."); // Muestra mensaje de error
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9' }}>
      <h2>Crear Nuevo Conductor</h2>
      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="nombre" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Nombre:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            required
          />
        </div>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="telefono" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Teléfono:</label>
          <input
            type="text"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            required
          />
        </div>
        <div style={{ marginBottom: '20px' }}>
          <label htmlFor="tipoVehiculo" style={{ display: 'block', marginBottom: '5px', fontWeight: 'bold' }}>Tipo de Vehículo:</label>
          <input
            type="text"
            id="tipoVehiculo"
            value={tipoVehiculo}
            onChange={(e) => setTipoVehiculo(e.target.value)}
            style={{ width: '100%', padding: '8px', borderRadius: '4px', border: '1px solid #ddd' }}
            required
          />
        </div>
        <button type="submit" style={{ padding: '10px 20px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '5px', cursor: 'pointer', fontSize: '16px' }}>
          Crear Conductor
        </button>
      </form>
      {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
    </div>
  );
}

export default DriverForm;