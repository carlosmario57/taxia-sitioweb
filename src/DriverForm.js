import React, { useState, useEffect } from 'react'; // Importa useEffect
import axios from 'axios';

// DriverForm ahora recibe 'editingDriver' y 'onCancelEdit'
function DriverForm({ onDriverCreated, editingDriver, onCancelEdit }) {
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // useEffect para precargar los datos cuando editingDriver cambie
  useEffect(() => {
    if (editingDriver) {
      // Si hay un conductor para editar, precarga sus datos en el formulario
      setNombre(editingDriver.nombre || '');
      setTelefono(editingDriver.telefono || '');
      setTipoVehiculo(editingDriver.tipoVehiculo || '');
      setMessage(''); // Limpia mensajes al iniciar edición
      setError('');   // Limpia errores al iniciar edición
    } else {
      // Si no hay conductor para editar, limpia el formulario para "crear"
      setNombre('');
      setTelefono('');
      setTipoVehiculo('');
    }
  }, [editingDriver]); // Este efecto se ejecuta cada vez que editingDriver cambia

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    if (!nombre || !telefono || !tipoVehiculo) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    try {
      const driverData = {
        nombre,
        telefono,
        tipoVehiculo
      };

      if (editingDriver) {
        // Si estamos editando, enviamos una petición PUT
        await axios.put(`http://127.0.0.1:5000/drivers/${editingDriver.id}`, driverData);
        setMessage(`Conductor "${nombre}" (ID: ${editingDriver.id}) actualizado exitosamente.`);
        onCancelEdit(); // Vuelve al modo de creación después de actualizar
      } else {
        // Si estamos creando, enviamos una petición POST
        const response = await axios.post('http://127.0.0.1:5000/drivers', driverData);
        setMessage(`Conductor "${response.data.id}" creado exitosamente.`);
      }

      // Limpia el formulario (o lo resetea si se estaba editando)
      setNombre('');
      setTelefono('');
      setTipoVehiculo('');

      // Llama a la función del padre para que la lista se actualice
      if (onDriverCreated) {
        onDriverCreated();
      }

    } catch (err) {
      console.error("Error al procesar conductor:", err);
      setError(`Error al ${editingDriver ? 'actualizar' : 'crear'} el conductor. Asegúrate de que el backend esté funcionando y los datos sean válidos.`);
    }
  };

  return (
    <div style={{ marginTop: '30px', padding: '20px', border: '1px solid #ccc', borderRadius: '8px', backgroundColor: '#f9f9f9', width: '100%', maxWidth: '400px' }}>
      <h2>{editingDriver ? 'Editar Conductor' : 'Crear Nuevo Conductor'}</h2>
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
        <button 
          type="submit" 
          style={{ 
            padding: '10px 20px', 
            backgroundColor: editingDriver ? '#007bff' : '#28a745', // Azul para editar, verde para crear
            color: 'white', 
            border: 'none', 
            borderRadius: '5px', 
            cursor: 'pointer', 
            fontSize: '16px',
            marginRight: '10px' // Espacio entre botones
          }}
        >
          {editingDriver ? 'Actualizar Conductor' : 'Crear Conductor'}
        </button>
        {editingDriver && ( // Muestra el botón de cancelar solo en modo edición
          <button 
            type="button" // Importante: tipo "button" para que no envíe el formulario
            onClick={onCancelEdit} 
            style={{ 
              padding: '10px 20px', 
              backgroundColor: '#6c757d', // Gris para cancelar
              color: 'white', 
              border: 'none', 
              borderRadius: '5px', 
              cursor: 'pointer', 
              fontSize: '16px'
            }}
          >
            Cancelar Edición
          </button>
        )}
      </form>
      {message && <p style={{ color: 'green', marginTop: '15px' }}>{message}</p>}
      {error && <p style={{ color: 'red', marginTop: '15px' }}>{error}</p>}
    </div>
  );
}

export default DriverForm;