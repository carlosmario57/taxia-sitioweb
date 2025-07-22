import React, { useState, useEffect } from 'react';
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
    // Contenedor principal del formulario con estilos Tailwind
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        {editingDriver ? 'Editar Conductor' : 'Crear Nuevo Conductor'}
      </h2>
      <form onSubmit={handleSubmit}>
        {/* Campo Nombre */}
        <div className="mb-4">
          <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
          <input
            type="text"
            id="nombre"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            required
          />
        </div>
        {/* Campo Teléfono */}
        <div className="mb-4">
          <label htmlFor="telefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono:</label>
          <input
            type="text"
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            required
          />
        </div>
        {/* Campo Tipo de Vehículo */}
        <div className="mb-6">
          <label htmlFor="tipoVehiculo" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Vehículo:</label>
          <input
            type="text"
            id="tipoVehiculo"
            value={tipoVehiculo}
            onChange={(e) => setTipoVehiculo(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
            required
          />
        </div>
        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`
              ${editingDriver ? 'bg-blue-500 hover:bg-blue-700' : 'bg-green-500 hover:bg-green-700'}
              text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out
            `}
          >
            {editingDriver ? 'Actualizar Conductor' : 'Crear Conductor'}
          </button>
          {editingDriver && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>
      {/* Mensajes de éxito o error */}
      {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
}

export default DriverForm;