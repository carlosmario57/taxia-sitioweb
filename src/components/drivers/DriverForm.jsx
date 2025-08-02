import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

// Importaciones de React y librerías externas.

/**
 * Componente DriverForm: Proporciona un formulario para crear o editar conductores.
 *
 * @param {Function} onDriverCreated - Función para notificar al padre sobre la creación/actualización.
 * @param {Object|null} editingDriver - Objeto del conductor a editar, o null si estamos creando.
 * @param {Function} onCancelEdit - Función para cancelar el modo de edición.
 * @param {Function} setMessage - Función para establecer un mensaje global de éxito.
 * @param {Function} setError - Función para establecer un mensaje global de error.
 */
function DriverForm({ onDriverCreated, editingDriver, onCancelEdit, setMessage, setError }) {
  // Estado consolidado para los datos del formulario.
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    tipoVehiculo: ''
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // useEffect para precargar los datos del conductor si estamos en modo edición.
  useEffect(() => {
    if (editingDriver) {
      setFormData({
        nombre: editingDriver.nombre || '',
        telefono: editingDriver.telefono || '',
        tipoVehiculo: editingDriver.tipoVehiculo || ''
      });
      setMessage('');
      setError('');
      setFormErrors({});
    } else {
      setFormData({
        nombre: '',
        telefono: '',
        tipoVehiculo: ''
      });
      setFormErrors({});
    }
  }, [editingDriver, setMessage, setError]);

  /**
   * Maneja los cambios en los campos del formulario y actualiza el estado consolidado.
   * @param {Object} e - Objeto de evento del input.
   */
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value,
    }));
  };

  /**
   * Valida el formulario en el frontend antes de enviarlo.
   * @returns {boolean} - true si el formulario es válido, false en caso contrario.
   */
  const validateForm = () => {
    const errors = {};
    if (!formData.nombre.trim()) {
      errors.nombre = 'El nombre es obligatorio.';
    }
    if (!formData.telefono.trim()) {
      errors.telefono = 'El teléfono es obligatorio.';
    } else if (!/^\d{7,15}$/.test(formData.telefono.trim())) {
      errors.telefono = 'El teléfono debe contener solo números (7-15 dígitos).';
    }
    if (!formData.tipoVehiculo.trim()) {
      errors.tipoVehiculo = 'El tipo de vehículo es obligatorio.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  /**
   * Maneja el envío del formulario.
   * @param {Object} e - Evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage('');
    setError('');

    if (!validateForm()) {
      setError('Por favor, corrige los errores en el formulario.');
      return;
    }

    setLoading(true);

    try {
      // Lógica de Autenticación de Firebase.
      const auth = getAuth();
      const user = auth.currentUser;

      if (!user) {
        setError('Debes iniciar sesión para realizar esta operación.');
        setLoading(false);
        return;
      }

      const idToken = await user.getIdToken();
      
      const driverData = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        tipoVehiculo: formData.tipoVehiculo.trim()
      };

      const axiosConfig = {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      };

      if (editingDriver) {
        // Modo Edición: Petición PUT
        await axios.put(`http://localhost:5000/drivers/${editingDriver.id}`, driverData, axiosConfig);
        setMessage(`Conductor "${formData.nombre}" (ID: ${editingDriver.id}) actualizado exitosamente.`);
        onCancelEdit();
      } else {
        // Modo Creación: Petición POST
        const response = await axios.post('http://localhost:5000/drivers', driverData, axiosConfig);
        setMessage(`Conductor "${response.data.nombre}" (ID: ${response.data.id}) creado exitosamente.`);
      }

      // Limpia el formulario y los errores después de un envío exitoso.
      setFormData({
        nombre: '',
        telefono: '',
        tipoVehiculo: ''
      });
      setFormErrors({});

      if (onDriverCreated) {
        onDriverCreated();
      }

    } catch (err) {
      console.error("Error al procesar conductor:", err);
      // Manejo mejorado de errores del backend.
      let errorMessage = `Error al ${editingDriver ? 'actualizar' : 'crear'} el conductor: `;
      if (err.response) {
        errorMessage += err.response.data?.error || `Código ${err.response.status}`;
      } else if (err.request) {
        errorMessage += 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      } else {
        errorMessage += err.message;
      }
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return (
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
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 ${formErrors.nombre ? 'border-red-500' : 'focus:ring-blue-500'} transition duration-150`}
            required
          />
          {formErrors.nombre && <p className="text-red-500 text-xs italic mt-1">{formErrors.nombre}</p>}
        </div>
        {/* Campo Teléfono */}
        <div className="mb-4">
          <label htmlFor="telefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono:</label>
          <input
            type="tel"
            id="telefono"
            name="telefono"
            value={formData.telefono}
            onChange={handleInputChange}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 ${formErrors.telefono ? 'border-red-500' : 'focus:ring-blue-500'} transition duration-150`}
            required
            pattern="[0-9]{7,15}"
            title="Ingresa solo números (7-15 dígitos)"
          />
          {formErrors.telefono && <p className="text-red-500 text-xs italic mt-1">{formErrors.telefono}</p>}
        </div>
        {/* Campo Tipo de Vehículo */}
        <div className="mb-6">
          <label htmlFor="tipoVehiculo" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Vehículo:</label>
          <select
            id="tipoVehiculo"
            name="tipoVehiculo"
            value={formData.tipoVehiculo}
            onChange={handleInputChange}
            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 ${formErrors.tipoVehiculo ? 'border-red-500' : 'focus:ring-blue-500'} transition duration-150`}
            required
          >
            <option value="">Seleccione un tipo</option>
            <option value="Mototaxi">Mototaxi</option>
            <option value="Bicitaxi">Bicitaxi</option>
            <option value="Taxi (particular)">Taxi (particular)</option>
            <option value="Automóvil">Automóvil</option>
            <option value="Camioneta">Camioneta</option>
          </select>
          {formErrors.tipoVehiculo && <p className="text-red-500 text-xs italic mt-1">{formErrors.tipoVehiculo}</p>}
        </div>
        {/* Botones de acción */}
        <div className="flex items-center justify-between space-x-4">
          <button
            type="submit"
            disabled={loading}
            className={`
              flex-1 py-2 px-4 rounded font-bold focus:outline-none focus:shadow-outline transition duration-150 ease-in-out
              ${editingDriver ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}
              text-white focus:ring-2 focus:ring-offset-2
              ${loading ? 'opacity-50 cursor-not-allowed' : ''}
            `}
          >
            {loading ? (editingDriver ? 'Actualizando...' : 'Creando...') : (editingDriver ? 'Actualizar Conductor' : 'Crear Conductor')}
          </button>
          {editingDriver && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={loading}
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