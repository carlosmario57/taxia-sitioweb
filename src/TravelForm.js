import React, { useState } from 'react';
import axios from 'axios';

function TravelForm({ onTravelCreated }) {
  // Estados para los campos del formulario
  const [pasajeroNombre, setPasajeroNombre] = useState('');
  const [pasajeroTelefono, setPasajeroTelefono] = useState('');
  const [ubicacionOrigenTexto, setUbicacionOrigenTexto] = useState('');
  const [ubicacionOrigenLat, setUbicacionOrigenLat] = useState('');
  const [ubicacionOrigenLon, setUbicacionOrigenLon] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  // Función para manejar el envío del formulario
  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevenir el comportamiento por defecto del formulario

    setMessage(''); // Limpiar mensajes anteriores
    setError('');   // Limpiar errores anteriores

    // Validaciones básicas
    if (!pasajeroNombre) {
      setError('El nombre del pasajero es obligatorio.');
      return;
    }

    // Validar que al menos una forma de ubicación de origen esté presente
    if (!ubicacionOrigenTexto && (!ubicacionOrigenLat || !ubicacionOrigenLon)) {
      setError('Debe proporcionar una ubicación de origen (texto o coordenadas GPS).');
      return;
    }

    // Preparar los datos del viaje
    const travelData = {
      pasajero_nombre: pasajeroNombre,
      pasajero_telefono: pasajeroTelefono,
      ubicacion_origen_texto: ubicacionOrigenTexto,
      // Convertir latitud y longitud a números si están presentes
      ubicacion_origen_lat: ubicacionOrigenLat ? parseFloat(ubicacionOrigenLat) : null,
      ubicacion_origen_lon: ubicacionOrigenLon ? parseFloat(ubicacionOrigenLon) : null,
      // Otros campos como destino, estado, conductor, etc., se pueden añadir aquí
      // o se establecerán con valores por defecto en el backend.
    };

    try {
      // Enviar los datos al backend Flask
      const response = await axios.post('http://127.0.0.1:5000/viajes', travelData);
      setMessage(`Viaje para "${response.data.id}" creado exitosamente.`);

      // Limpiar el formulario después de un envío exitoso
      setPasajeroNombre('');
      setPasajeroTelefono('');
      setUbicacionOrigenTexto('');
      setUbicacionOrigenLat('');
      setUbicacionOrigenLon('');

      // Notificar al componente padre que un viaje ha sido creado
      if (onTravelCreated) {
        onTravelCreated();
      }

    } catch (err) {
      console.error("Error al crear viaje:", err);
      // Mostrar un mensaje de error más amigable
      setError(`Error al crear el viaje. Asegúrate de que el backend esté funcionando y los datos sean válidos. (${err.response?.data?.error || err.message})`);
    }
  };

  return (
    // Contenedor principal del formulario con estilos Tailwind
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md">
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
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
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
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
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
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
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:border-blue-500"
              step="any" // Permite números decimales
              placeholder="Ej: -74.0721"
            />
          </div>
        </div>
        {/* Botón de Crear Viaje */}
        <div className="flex items-center justify-center mt-6">
          <button
            type="submit"
            className="bg-purple-600 hover:bg-purple-700 text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out"
          >
            Crear Viaje
          </button>
        </div>
      </form>
      {/* Mensajes de éxito o error */}
      {message && <p className="text-green-500 text-sm mt-4 text-center">{message}</p>}
      {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
    </div>
  );
}

export default TravelForm;