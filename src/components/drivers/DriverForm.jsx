import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth'; // ¡Importante! Importa getAuth de Firebase para obtener el usuario actual

// Componente DriverForm: Proporciona un formulario para crear o editar conductores.
// Recibe props de App.js para el manejo global de estados y mensajes.
function DriverForm({ onDriverCreated, editingDriver, onCancelEdit, setMessage, setError }) {
  // Estados internos del formulario para los valores de los campos
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [tipoVehiculo, setTipoVehiculo] = useState('');
  const [loading, setLoading] = useState(false); // Nuevo estado para controlar el estado de carga
  const [formErrors, setFormErrors] = useState({}); // Nuevo estado para errores de validación de formulario

  // useEffect para precargar los datos del conductor si estamos en modo edición
  useEffect(() => {
    if (editingDriver) {
      // Si hay un conductor para editar, precarga sus datos en los estados del formulario
      setNombre(editingDriver.nombre || '');
      setTelefono(editingDriver.telefono || '');
      setTipoVehiculo(editingDriver.tipoVehiculo || '');
      setMessage(''); // Limpia mensajes globales al iniciar edición
      setError('');   // Limpia errores globales al iniciar edición
      setFormErrors({}); // Limpia errores de formulario al iniciar edición
    } else {
      // Si no hay conductor para editar (modo creación o edición cancelada), limpia el formulario
      setNombre('');
      setTelefono('');
      setTipoVehiculo('');
      setFormErrors({}); // Limpia errores de formulario
    }
  }, [editingDriver, setMessage, setError]); // Dependencias para reaccionar a cambios en editingDriver y setters

  // Función de validación del formulario en el frontend
  const validateForm = () => {
    const errors = {};
    if (!nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio.';
    }
    if (!telefono.trim()) {
      errors.telefono = 'El teléfono es obligatorio.';
    } else if (!/^\d{7,15}$/.test(telefono.trim())) { // Ejemplo: 7 a 15 dígitos numéricos
      errors.telefono = 'El teléfono debe contener solo números (7-15 dígitos).';
    }
    if (!tipoVehiculo.trim()) {
      errors.tipoVehiculo = 'El tipo de vehículo es obligatorio.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0; // Retorna true si no hay errores
  };

  // Función que se ejecuta al enviar el formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario (recargar la página)

    setMessage(''); // Limpia mensajes globales del padre
    setError('');   // Limpia errores globales del padre

    if (!validateForm()) {
      setError('Por favor, corrige los errores en el formulario.');
      return;
    }

    setLoading(true); // Activa el estado de carga

    try {
      // --- Lógica de Autenticación de Firebase ---
      const auth = getAuth(); // Obtiene la instancia de autenticación
      const user = auth.currentUser; // Obtiene el usuario actualmente logueado

      if (!user) {
        // Si no hay un usuario autenticado, muestra un error y detiene la ejecución
        setError('Debes iniciar sesión para realizar esta operación.');
        setLoading(false);
        return;
      }

      // Obtiene el token de ID del usuario. Este token se usa para autenticar la petición al backend.
      const idToken = await user.getIdToken();
      // console.log("Firebase ID Token:", idToken); // Útil para depuración, pero no en producción

      // Objeto con los datos del conductor a enviar
      const driverData = {
        nombre: nombre.trim(), // Limpia espacios en blanco
        telefono: telefono.trim(), // Limpia espacios en blanco
        tipoVehiculo: tipoVehiculo.trim() // Limpia espacios en blanco
      };

      // Configuración de los encabezados de Axios, incluyendo el token de autorización
      const axiosConfig = {
        headers: {
          'Authorization': `Bearer ${idToken}` // Formato estándar: "Bearer <token>"
        }
      };

      if (editingDriver) {
        // Si estamos en modo edición, enviamos una petición PUT para actualizar
        await axios.put(`http://localhost:5000/drivers/${editingDriver.id}`, driverData, axiosConfig);
        setMessage(`Conductor "${nombre}" (ID: ${editingDriver.id}) actualizado exitosamente.`);
        onCancelEdit(); // Vuelve al modo de creación después de actualizar
      } else {
        // Si estamos creando, enviamos una petición POST para añadir
        const response = await axios.post('http://localhost:5000/drivers', driverData, axiosConfig);
        setMessage(`Conductor "${response.data.id}" creado exitosamente.`);
      }

      // Limpia el formulario después de un envío/actualización exitosa
      setNombre('');
      setTelefono('');
      setTipoVehiculo('');
      setFormErrors({}); // Limpia errores de formulario

      // Notifica al componente padre (App.js) para que recargue la lista de conductores
      if (onDriverCreated) {
        onDriverCreated();
      }

    } catch (err) {
      console.error("Error al procesar conductor:", err);
      // **Manejo mejorado de errores del backend:**
      let errorMessage = `Error al ${editingDriver ? 'actualizar' : 'crear'} el conductor: `;
      if (err.response) {
        // El servidor respondió con un estado fuera del rango 2xx
        // Intenta obtener el mensaje de error del backend si está disponible
        if (err.response.data && err.response.data.error) {
          errorMessage += err.response.data.error;
        } else if (err.response.data && typeof err.response.data === 'string') {
          errorMessage += err.response.data;
        } else {
          // Si el backend no da un mensaje específico, usa el estado HTTP
          errorMessage += `Código ${err.response.status} - ${err.response.statusText}`;
        }
      } else if (err.request) {
        // La petición fue hecha pero no se recibió respuesta (ej. red caída, servidor no responde)
        errorMessage += 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      } else {
        // Algo más causó el error (ej. error en la configuración de Axios)
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false); // Desactiva el estado de carga siempre al finalizar
    }
  };

  return (
    // Contenedor principal del formulario con estilos Tailwind
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-xl bg-white w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
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
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 ${formErrors.nombre ? 'border-red-500' : 'focus:ring-blue-500'} transition duration-150`}
            required
          />
          {formErrors.nombre && <p className="text-red-500 text-xs italic mt-1">{formErrors.nombre}</p>}
        </div>
        {/* Campo Teléfono */}
        <div className="mb-4">
          <label htmlFor="telefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono:</label>
          <input
            type="tel" // Cambiado a type="tel" para indicar número telefónico
            id="telefono"
            value={telefono}
            onChange={(e) => setTelefono(e.target.value)}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 ${formErrors.telefono ? 'border-red-500' : 'focus:ring-blue-500'} transition duration-150`}
            required
            pattern="[0-9]{7,15}" // Sugiere un patrón para navegadores
            title="Ingresa solo números (7-15 dígitos)" // Mensaje de ayuda para el patrón
          />
          {formErrors.telefono && <p className="text-red-500 text-xs italic mt-1">{formErrors.telefono}</p>}
        </div>
        {/* Campo Tipo de Vehículo: Cambiado a un <select> */}
        <div className="mb-6">
          <label htmlFor="tipoVehiculo" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Vehículo:</label>
          <select
            id="tipoVehiculo"
            value={tipoVehiculo}
            onChange={(e) => setTipoVehiculo(e.target.value)}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 ${formErrors.tipoVehiculo ? 'border-red-500' : 'focus:ring-blue-500'} transition duration-150`}
            required
          >
            <option value="">Seleccione un tipo</option>
            {/* Opciones sugeridas para La Jagua de Ibirico */}
            <option value="Mototaxi">Mototaxi</option>
            <option value="Bicitaxi">Bicitaxi</option>
            <option value="Taxi (particular)">Taxi (particular)</option>
            {/* Puedes agregar más opciones si son relevantes para tu contexto */}
          </select>
          {formErrors.tipoVehiculo && <p className="text-red-500 text-xs italic mt-1">{formErrors.tipoVehiculo}</p>}
        </div>
        {/* Botones de acción */}
        <div className="flex items-center justify-between space-x-4">
          <button
            type="submit"
            disabled={loading} // Deshabilita el botón mientras carga
            className={`
              flex-1 py-2 px-4 rounded font-bold focus:outline-none focus:shadow-outline transition duration-150 ease-in-out
              ${editingDriver ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}
              text-white focus:ring-2 focus:ring-offset-2
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {loading ? (editingDriver ? 'Actualizando...' : 'Creando...') : (editingDriver ? 'Actualizar Conductor' : 'Crear Conductor')}
          </button>
          {editingDriver && ( // Muestra el botón de cancelar solo en modo edición
            <button
              type="button" // Importante: tipo "button" para que no envíe el formulario
              onClick={onCancelEdit}
              disabled={loading} // Deshabilita el botón mientras carga
              className={`flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-gray-500
                ${loading ? 'opacity-50 cursor-not-allowed' : ''}
              `}
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default DriverForm;