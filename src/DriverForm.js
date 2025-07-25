import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Componente DriverForm: Proporciona un formulario para crear o editar conductores.
// Recibe props de App.js para el manejo global de estados y mensajes.
function DriverForm({ onDriverCreated, editingDriver, onCancelEdit, setMessage, setError }) {
  // Estados internos del formulario para los valores de los campos
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('');

  // useEffect para precargar los datos del conductor si estamos en modo edición
  useEffect(() => {
    if (editingDriver) {
      // Si hay un conductor para editar, precarga sus datos en los estados del formulario
      setNombre(editingDriver.nombre || '');
      setTelefono(editingDriver.telefono || '');
      setTipoVehiculo(editingDriver.tipoVehiculo || '');
      setMessage(''); // Limpia mensajes globales del padre al iniciar edición
      setError('');   // Limpia errores globales del padre al iniciar edición
    } else {
      // Si no hay conductor para editar (modo creación o edición cancelada), limpia el formulario
      setNombre('');
      setTelefono('');
      setTipoVehiculo('');
    }
  }, [editingDriver, setMessage, setError]); // Se ejecuta cuando editingDriver cambia, o cuando los setters globales cambian (por seguridad)

  /**
   * Maneja el envío del formulario, ya sea para crear o actualizar un conductor.
   * @param {Event} e - El evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página)

    setMessage(''); // Limpia mensajes globales del padre
    setError('');   // Limpia errores globales del padre

    // Validación básica de los campos obligatorios
    if (!nombre || !telefono || !tipoVehiculo) {
      setError('Todos los campos son obligatorios.');
      return;
    }

    try {
      // Objeto con los datos del conductor a enviar
      const driverData = {
        nombre,
        telefono,
        tipoVehiculo
      };

      if (editingDriver) {
        // Si estamos en modo edición, enviamos una petición PUT para actualizar
        await axios.put(`http://localhost:5000/drivers/${editingDriver.id}`, driverData);
        setMessage(`Conductor "${nombre}" (ID: ${editingDriver.id}) actualizado exitosamente.`);
        onCancelEdit(); // Vuelve al modo de creación después de actualizar
      } else {
        // Si estamos creando, enviamos una petición POST para añadir
        const response = await axios.post('http://localhost:5000/drivers', driverData);
        setMessage(`Conductor "${response.data.id}" creado exitosamente.`);
      }

      // Limpia el formulario después de un envío/actualización exitosa
      setNombre('');
      setTelefono('');
      setTipoVehiculo('');

      // Notifica al componente padre (App.js) para que recargue la lista de conductores
      // App.js se encargará de que DriverList recargue sus propios datos.
      if (onDriverCreated) {
        onDriverCreated();
      }

    } catch (err) {
      console.error("Error al procesar conductor:", err);
      // Extrae el mensaje de error del backend si está disponible, sino usa un mensaje genérico
      const backendErrorMessage = err.response?.data?.error || err.message;
      setError(`Error al ${editingDriver ? 'actualizar' : 'crear'} el conductor: ${backendErrorMessage}.`);
    }
  };

  return (
    // Contenedor principal del formulario con estilos Tailwind
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>
        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <button 
            type="submit" 
            className={`
              ${editingDriver ? 'bg-blue-600 hover:bg-blue-700' : 'bg-green-600 hover:bg-green-700'}
              text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            `}
          >
            {editingDriver ? 'Actualizar Conductor' : 'Crear Conductor'}
          </button>
          {editingDriver && ( // Muestra el botón de cancelar solo en modo edición
            <button 
              type="button" // Importante: tipo "button" para que no envíe el formulario
              onClick={onCancelEdit} 
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>
      {/* Los mensajes de éxito o error ahora se muestran globalmente en App.js.
          Si quieres feedback instantáneo aquí, puedes añadir estados locales,
          pero el global ya se encargará de notificar al usuario. */}
    </div>
  );
}

export default DriverForm;
