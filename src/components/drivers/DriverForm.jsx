import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

/**
 * Custom Hook para gestionar la autenticación de Firebase y el token de acceso.
 *
 * @returns {Object} - Un objeto con el usuario, el token de acceso y un estado de carga.
 */
const useFirebaseAuthToken = () => {
  const [user, setUser] = useState(null);
  const [idToken, setIdToken] = useState(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  useEffect(() => {
    const auth = getAuth();
    const unsubscribe = auth.onAuthStateChanged(async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const token = await currentUser.getIdToken();
          setIdToken(token);
        } catch (error) {
          console.error("Error al obtener el token de autenticación:", error);
        }
      } else {
        setUser(null);
        setIdToken(null);
      }
      setIsAuthLoading(false);
    });

    return () => unsubscribe();
  }, []);

  return { user, idToken, isAuthLoading };
};

/**
 * Componente FeedbackMessage: Muestra mensajes animados de éxito o error.
 *
 * @param {string|null} message - El mensaje a mostrar.
 * @param {string} type - 'success' o 'error' para definir el estilo.
 */
const FeedbackMessage = ({ message, type }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (message) {
      setIsVisible(true);
      const timer = setTimeout(() => {
        setIsVisible(false);
      }, 5000); // El mensaje desaparece después de 5 segundos
      return () => clearTimeout(timer);
    }
  }, [message]);

  const baseClasses = "fixed bottom-4 right-4 p-4 text-sm rounded-lg shadow-lg transition-all duration-500 ease-in-out";
  const typeClasses = type === 'success'
    ? "bg-green-100 text-green-700"
    : "bg-red-100 text-red-700";

  const visibilityClasses = isVisible
    ? "translate-x-0 opacity-100"
    : "translate-x-full opacity-0";

  if (!message) return null;

  return (
    <div className={`${baseClasses} ${typeClasses} ${visibilityClasses}`} role="alert">
      {message}
    </div>
  );
};

/**
 * Componente DriverForm: Proporciona un formulario para crear o editar conductores.
 * Este componente es una versión profesional y mejorada del original, con feedback
 * visual, manejo de errores optimizado y uso de variables de entorno.
 *
 * @param {Function} onDriverCreated - Función para notificar al padre sobre la creación/actualización exitosa.
 * @param {Object|null} editingDriver - Objeto del conductor a editar, o null si estamos creando.
 * @param {Function} onCancelEdit - Función para cancelar el modo de edición y limpiar el formulario.
 */
function DriverForm({ onDriverCreated, editingDriver, onCancelEdit }) {
  // Estado consolidado para los datos del formulario.
  const [formData, setFormData] = useState({
    nombre: '',
    telefono: '',
    tipoVehiculo: '',
    licencia: '',
    placa: '',
  });
  const [loading, setLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Uso del custom hook para la autenticación de Firebase
  const { user, idToken, isAuthLoading } = useFirebaseAuthToken();

  // URL del API obtenida de las variables de entorno.
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

  /**
   * useEffect para precargar los datos del conductor si estamos en modo edición.
   * Se ejecuta cada vez que el objeto `editingDriver` cambia.
   */
  useEffect(() => {
    if (editingDriver) {
      setFormData({
        nombre: editingDriver.nombre || '',
        telefono: editingDriver.telefono || '',
        tipoVehiculo: editingDriver.tipoVehiculo || '',
        licencia: editingDriver.licencia || '',
        placa: editingDriver.placa || '',
      });
      // Limpiar mensajes globales y errores del formulario al iniciar la edición
      setSuccessMessage(null);
      setErrorMessage(null);
      setFormErrors({});
    } else {
      // Limpiar el formulario y los errores si no hay un conductor para editar.
      setFormData({
        nombre: '',
        telefono: '',
        tipoVehiculo: '',
        licencia: '',
        placa: '',
      });
      setFormErrors({});
    }
  }, [editingDriver]);

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
    // Limpiar el error específico del campo cuando el usuario comienza a escribir.
    setFormErrors(prevErrors => ({
      ...prevErrors,
      [name]: undefined,
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
    if (!formData.licencia.trim()) {
      errors.licencia = 'La licencia es obligatoria.';
    }
    if (!formData.placa.trim()) {
      errors.placa = 'La placa es obligatoria.';
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
    setSuccessMessage(null);
    setErrorMessage(null);

    if (!validateForm()) {
      setErrorMessage('Por favor, corrige los errores en el formulario.');
      return;
    }

    setLoading(true);

    if (isAuthLoading) {
      setErrorMessage('Autenticación en curso, por favor espera.');
      setLoading(false);
      return;
    }

    if (!user || !idToken) {
      setErrorMessage('Debes iniciar sesión para realizar esta operación.');
      setLoading(false);
      return;
    }

    try {
      const driverData = {
        nombre: formData.nombre.trim(),
        telefono: formData.telefono.trim(),
        tipoVehiculo: formData.tipoVehiculo.trim(),
        licencia: formData.licencia.trim(),
        placa: formData.placa.trim(),
      };

      const axiosConfig = {
        headers: {
          'Authorization': `Bearer ${idToken}`
        }
      };

      if (editingDriver) {
        // Modo Edición: Petición PUT
        await axios.put(`${API_URL}/drivers/${editingDriver.id}`, driverData, axiosConfig);
        setSuccessMessage(`Conductor "${formData.nombre}" (ID: ${editingDriver.id}) actualizado exitosamente.`);
        onCancelEdit();
      } else {
        // Modo Creación: Petición POST
        const response = await axios.post(`${API_URL}/drivers`, driverData, axiosConfig);
        setSuccessMessage(`Conductor "${response.data.nombre}" (ID: ${response.data.id}) creado exitosamente.`);
      }

      // Limpia el formulario y los errores después de un envío exitoso.
      setFormData({
        nombre: '',
        telefono: '',
        tipoVehiculo: '',
        licencia: '',
        placa: '',
      });
      setFormErrors({});

      if (onDriverCreated) {
        onDriverCreated();
      }

    } catch (err) {
      console.error("Error al procesar conductor:", err);
      let errorMsg = `Error al ${editingDriver ? 'actualizar' : 'crear'} el conductor: `;
      if (err.response) {
        errorMsg += err.response.data?.error || `Código ${err.response.status}`;
      } else if (err.request) {
        errorMsg += 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo.';
      } else {
        errorMsg += err.message;
      }
      setErrorMessage(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-8 p-6 border border-gray-200 rounded-xl shadow-2xl bg-white w-full max-w-lg mx-auto transform hover:scale-105 transition-transform duration-300">
      <h2 className="text-3xl font-extrabold text-gray-800 mb-6 text-center">
        {editingDriver ? 'Editar Conductor' : 'Crear Nuevo Conductor'}
      </h2>

      <form onSubmit={handleSubmit} noValidate>
        {/* Campo Nombre */}
        <div className="mb-4">
          <label htmlFor="nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
          <input
            type="text"
            id="nombre"
            name="nombre"
            value={formData.nombre}
            onChange={handleInputChange}
            className={`shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:shadow-outline transition duration-150 ${formErrors.nombre ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-invalid={!!formErrors.nombre}
            aria-describedby="nombre-error"
          />
          {formErrors.nombre && <p id="nombre-error" className="text-red-500 text-xs italic mt-1">{formErrors.nombre}</p>}
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
            className={`shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:shadow-outline transition duration-150 ${formErrors.telefono ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-invalid={!!formErrors.telefono}
            aria-describedby="telefono-error"
          />
          {formErrors.telefono && <p id="telefono-error" className="text-red-500 text-xs italic mt-1">{formErrors.telefono}</p>}
        </div>

        {/* Campo Tipo de Vehículo */}
        <div className="mb-6">
          <label htmlFor="tipoVehiculo" className="block text-gray-700 text-sm font-bold mb-2">Tipo de Vehículo:</label>
          <select
            id="tipoVehiculo"
            name="tipoVehiculo"
            value={formData.tipoVehiculo}
            onChange={handleInputChange}
            className={`shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:shadow-outline transition duration-150 ${formErrors.tipoVehiculo ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-invalid={!!formErrors.tipoVehiculo}
            aria-describedby="tipoVehiculo-error"
          >
            <option value="">Seleccione un tipo</option>
            <option value="Mototaxi">Mototaxi</option>
            <option value="Bicitaxi">Bicitaxi</option>
            <option value="Taxi (particular)">Taxi (particular)</option>
            <option value="Automóvil">Automóvil</option>
            <option value="Camioneta">Camioneta</option>
            <option value="Furgón">Furgón</option>
            <option value="Camión">Camión</option>
          </select>
          {formErrors.tipoVehiculo && <p id="tipoVehiculo-error" className="text-red-500 text-xs italic mt-1">{formErrors.tipoVehiculo}</p>}
        </div>

        {/* Campo Licencia */}
        <div className="mb-4">
          <label htmlFor="licencia" className="block text-gray-700 text-sm font-bold mb-2">Número de Licencia:</label>
          <input
            type="text"
            id="licencia"
            name="licencia"
            value={formData.licencia}
            onChange={handleInputChange}
            className={`shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:shadow-outline transition duration-150 ${formErrors.licencia ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-invalid={!!formErrors.licencia}
            aria-describedby="licencia-error"
          />
          {formErrors.licencia && <p id="licencia-error" className="text-red-500 text-xs italic mt-1">{formErrors.licencia}</p>}
        </div>

        {/* Campo Placa */}
        <div className="mb-6">
          <label htmlFor="placa" className="block text-gray-700 text-sm font-bold mb-2">Placa del Vehículo:</label>
          <input
            type="text"
            id="placa"
            name="placa"
            value={formData.placa}
            onChange={handleInputChange}
            className={`shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-4 focus:ring-blue-500/50 focus:shadow-outline transition duration-150 ${formErrors.placa ? 'border-red-500' : 'border-gray-300'}`}
            required
            aria-invalid={!!formErrors.placa}
            aria-describedby="placa-error"
          />
          {formErrors.placa && <p id="placa-error" className="text-red-500 text-xs italic mt-1">{formErrors.placa}</p>}
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between space-x-4">
          <button
            type="submit"
            disabled={loading || isAuthLoading}
            className={`
              flex-1 flex items-center justify-center py-2 px-4 rounded-lg font-bold text-white focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-4 focus:ring-offset-2
              ${editingDriver ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'}
              ${loading || isAuthLoading ? 'opacity-70 cursor-not-allowed' : ''}
            `}
          >
            {loading || isAuthLoading ? (
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : null}
            {loading || isAuthLoading ? (editingDriver ? 'Actualizando...' : 'Creando...') : (editingDriver ? 'Actualizar Conductor' : 'Crear Conductor')}
          </button>
          {editingDriver && (
            <button
              type="button"
              onClick={onCancelEdit}
              disabled={loading || isAuthLoading}
              className={`flex-1 bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded-lg focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-4 focus:ring-offset-2 focus:ring-gray-500
                ${loading || isAuthLoading ? 'opacity-70 cursor-not-allowed' : ''}
              `}
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>

      <FeedbackMessage message={successMessage} type="success" />
      <FeedbackMessage message={errorMessage} type="error" />
    </div>
  );
}

export default DriverForm;
