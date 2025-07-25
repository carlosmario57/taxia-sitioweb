import React, { useState } from 'react';
import axios from 'axios';

// Componente TravelForm: Formulario para crear nuevos viajes.
// Recibe:
// - onTravelCreated: Función para notificar al padre cuando un viaje es creado.
// - setMessage (prop): Función para actualizar el mensaje global en el padre (App.js).
// - setError (prop): Función para actualizar el error global en el padre (App.js).
function TravelForm({ onTravelCreated, setMessage, setError }) {
  // Estados internos del formulario para los valores de los campos
  const [pasajeroNombre, setPasajeroNombre] = useState('');
  const [pasajeroTelefono, setPasajeroTelefono] = useState('');
  const [ubicacionOrigenTexto, setUbicacionOrigenTexto] = useState('');
  const [ubicacionOrigenLat, setUbicacionOrigenLat] = useState('');
  const [ubicacionOrigenLon, setUbicacionOrigenLon] = useState('');
  
  /**
   * Maneja el envío del formulario para crear un nuevo viaje.
   * @param {Event} e - El evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault(); // Previene el comportamiento por defecto del formulario

    setMessage(''); // Limpia mensajes globales del padre antes de la petición
    setError('');   // Limpia errores globales del padre

    // Validación básica de los campos obligatorios
    if (!pasajeroNombre) {
      setError('El nombre del pasajero es obligatorio.');
      return;
    }

    // Validación: debe proporcionar al menos una forma de ubicación de origen
    if (!ubicacionOrigenTexto && (!ubicacionOrigenLat || !ubicacionOrigenLon)) {
      setError('Debe proporcionar una ubicación de origen (texto o coordenadas GPS).');
      return;
    }

    // Preparar los datos del viaje a enviar al backend
    const travelData = {
      pasajero_nombre: pasajeroNombre,
      pasajero_telefono: pasajeroTelefono,
      ubicacion_origen_texto: ubicacionOrigenTexto,
      // Convertir latitud y longitud a números flotantes si están presentes
      ubicacion_origen_lat: ubicacionOrigenLat ? parseFloat(ubicacionOrigenLat) : null,
      ubicacion_origen_lon: ubicacionOrigenLon ? parseFloat(ubicacionOrigenLon) : null,
      // Otros campos como destino, estado, conductor, etc., serán gestionados por el backend.
    };

    try {
      // Realiza la petición POST a tu backend Flask para crear un viaje
      // URL CRÍTICA: Asegúrate de que esta URL sea la correcta y apunte a tu backend Flask.
      const response = await axios.post('http://localhost:5000/viajes', travelData);
      setMessage(`Viaje para "${response.data.id}" creado exitosamente.`); // Mensaje de éxito global
      
      // Limpiar el formulario después de un envío exitoso
      setPasajeroNombre('');
      setPasajeroTelefono('');
      setUbicacionOrigenTexto('');
      setUbicacionOrigenLat('');
      setUbicacionOrigenLon('');

      // Notificar al componente padre (App.js) que un viaje ha sido creado
      if (onTravelCreated) {
        onTravelCreated(); // Llama a la función del padre para que recargue la lista de viajes
      }

    } catch (err) {
      console.error("Error al crear viaje:", err);
      // Extraer el mensaje de error del backend si está disponible, o usar uno genérico
      const errorMessage = err.response?.data?.error || err.message;
      setError(`Error al crear el viaje: ${errorMessage}.`); // Mensaje de error global
    }
  };

  return (
    // Contenedor principal del formulario con estilos Tailwind
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Crear Nuevo Viaje</h2>
      <form onSubmit={handleSubmit}>
        {/* Campo Nombre del Pasajero */}
        <div className="mb-4">
          <label htmlFor="pasajeroNombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Pasajero:</label>
          <input
            type="text"
            id="pasajeroNombre"
            value={pasajeroNombre}
            onChange={(e) => setPasajeroNombre(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
            required
          />
        </div>
        {/* Campo Teléfono del Pasajero */}
        <div className="mb-4">
          <label htmlFor="pasajeroTelefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono del Pasajero:</label>
          <input
            type="text"
            id="pasajeroTelefono"
            value={pasajeroTelefono}
            onChange={(e) => setPasajeroTelefono(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
          />
        </div>
        {/* Campo Ubicación de Origen (Texto) */}
        <div className="mb-4">
          <label htmlFor="ubicacionOrigenTexto" className="block text-gray-700 text-sm font-bold mb-2">Ubicación de Origen (Texto):</label>
          <input
            type="text"
            id="ubicacionOrigenTexto"
            value={ubicacionOrigenTexto}
            onChange={(e) => setUbicacionOrigenTexto(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: Calle 10 # 5-20, cerca del parque"
          />
        </div>
        {/* Campos Ubicación de Origen (Latitud y Longitud) */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label htmlFor="ubicacionOrigenLat" className="block text-gray-700 text-sm font-bold mb-2">Latitud GPS:</label>
            <input
              type="number"
              id="ubicacionOrigenLat"
              value={ubicacionOrigenLat}
              onChange={(e) => setUbicacionOrigenLat(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="any" // Permite números decimales
              placeholder="Ej: 4.7110"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="ubicacionOrigenLon" className="block text-gray-700 text-sm font-bold mb-2">Longitud GPS:</label>
            <input
              type="number"
              id="ubicacionOrigenLon"
              value={ubicacionOrigenLon}
              onChange={(e) => setUbicacionOrigenLon(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="any" // Permite números decimales
              placeholder="Ej: -74.0721"
            />
          </div>
        </div>
        {/* Botón de Crear Viaje */}
        <div className="flex items-center justify-center mt-6">
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
          >
            Crear Viaje
          </button>
        </div>
      </form>
      {/* Los mensajes de éxito/error ahora se gestionan globalmente en App.js */}
    </div>
  );
}

export default TravelForm;
