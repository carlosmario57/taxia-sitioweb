// =================================================================================================
// ARCHIVO: src/hooks/useGeolocation.js
// FUNCIÓN: Hook personalizado para obtener la posición geográfica del usuario en tiempo real.
//          Utiliza la API `navigator.geolocation.watchPosition` para actualizaciones continuas.
// PROPIEDADES:
// - options: Objeto opcional de configuración para la API de geolocalización (ej: { enableHighAccuracy: true }).
// =================================================================================================

import { useState, useEffect } from 'react';

// Estado inicial para la geolocalización.
const initialState = {
  loading: true,
  error: null,
  data: null,
};

/**
 * Hook personalizado para acceder a la geolocalización del dispositivo.
 * Escucha la posición del usuario en tiempo real.
 *
 * @param {object} [options] - Opciones para la API de `navigator.geolocation`.
 * @returns {{ data: object|null, loading: boolean, error: object|null }} - Un objeto con los datos de posición, el estado de carga y el estado de error.
 */
const useGeolocation = (options = {}) => {
  const [state, setState] = useState(initialState);

  // El efecto se encarga de configurar y limpiar el "observador" de posición.
  useEffect(() => {
    // 1. Verificar si la API de geolocalización está disponible en el navegador.
    if (!navigator.geolocation) {
      console.error("Geolocalización no soportada por el navegador.");
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: new Error("Tu navegador no soporta la API de geolocalización.")
      }));
      return;
    }

    // 2. Definir las funciones de éxito y error.
    const onSuccess = (position) => {
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: null,
        data: {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          timestamp: position.timestamp,
        },
      }));
    };

    const onError = (geoError) => {
      console.error("Error de geolocalización:", geoError);
      setState(prevState => ({
        ...prevState,
        loading: false,
        error: geoError,
      }));
    };

    // 3. Iniciar el "observador" de posición y guardar su ID.
    // El "observador" llamará a onSuccess cada vez que la posición cambie.
    const watchId = navigator.geolocation.watchPosition(onSuccess, onError, options);

    // 4. Función de limpieza. Se ejecutará cuando el componente que usa el hook se desmonte.
    // Esto es crucial para detener la escucha y evitar pérdidas de memoria.
    return () => {
      navigator.geolocation.clearWatch(watchId);
    };
  }, [options]); // El efecto se vuelve a ejecutar si las opciones cambian.

  return state;
};

export default useGeolocation;

// =================================================================================================
// EJEMPLO DE USO DEL HOOK
// =================================================================================================
const GeolocationDisplay = () => {
  const { data, loading, error } = useGeolocation({ enableHighAccuracy: true });

  if (loading) {
    return (
      <div className="p-6 bg-blue-50 text-blue-800 rounded-xl shadow-lg mt-8 text-center">
        <h3 className="text-xl font-bold">Obteniendo tu ubicación...</h3>
        <p className="text-sm mt-2">Por favor, acepta la solicitud de geolocalización del navegador.</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 bg-red-100 text-red-800 rounded-xl shadow-lg mt-8 text-center">
        <h3 className="text-xl font-bold">Error de Geolocalización</h3>
        <p className="text-sm mt-2">Código de error: {error.code} - {error.message}</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white rounded-xl shadow-lg mt-8">
      <h3 className="text-xl font-bold text-gray-800 text-center mb-4">Ubicación Actual</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-center">
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-500 font-medium">Latitud</p>
          <p className="text-lg font-mono text-gray-800 break-words">{data.latitude.toFixed(6)}</p>
        </div>
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-sm text-gray-500 font-medium">Longitud</p>
          <p className="text-lg font-mono text-gray-800 break-words">{data.longitude.toFixed(6)}</p>
        </div>
      </div>
    </div>
  );
};
