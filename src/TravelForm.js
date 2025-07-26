import React, { useState, useEffect } from 'react'; // Importa useEffect
import axios from 'axios';

// Componente TravelForm: Formulario para crear nuevos viajes o editar existentes.
// Recibe:
// - onTravelCreated: Función para notificar al padre cuando un viaje es creado/actualizado.
// - editingTravel: Objeto viaje si se está editando, o null si se está creando.
// - onCancelEdit: Función para cancelar el modo edición y volver a crear.
// - setMessage (prop): Función para actualizar el mensaje global en el padre (App.js).
// - setError (prop): Función para actualizar el error global en el padre (App.js).
function TravelForm({ onTravelCreated, editingTravel, onCancelEdit, setMessage, setError }) {
  // Estados internos del formulario para los valores de los campos
  const [pasajeroNombre, setPasajeroNombre] = useState('');
  const [pasajeroTelefono, setPasajeroTelefono] = useState('');
  const [ubicacionOrigenTexto, setUbicacionOrigenTexto] = useState('');
  const [ubicacionOrigenLat, setUbicacionOrigenLat] = useState('');
  const [ubicacionOrigenLon, setUbicacionOrigenLon] = useState('');
  const [ubicacionDestinoTexto, setUbicacionDestinoTexto] = useState(''); // Nuevo campo para destino
  const [ubicacionDestinoLat, setUbicacionDestinoLat] = useState('');
  const [ubicacionDestinoLon, setUbicacionDestinoLon] = useState('');
  const [estado, setEstado] = useState('pendiente'); // Estado del viaje
  const [conductorId, setConductorId] = useState(''); // ID del conductor asignado
  const [conductorNombre, setConductorNombre] = useState(''); // Nombre del conductor asignado
  const [notas, setNotas] = useState(''); // Notas del viaje

  // useEffect para precargar los datos del viaje si estamos en modo edición
  useEffect(() => {
    if (editingTravel) {
      // Precarga los datos del viaje en edición en los estados del formulario
      setPasajeroNombre(editingTravel.pasajero_nombre || '');
      setPasajeroTelefono(editingTravel.pasajero_telefono || '');
      setUbicacionOrigenTexto(editingTravel.ubicacion_origen_texto || '');
      setUbicacionOrigenLat(editingTravel.ubicacion_origen_lat || '');
      setUbicacionOrigenLon(editingTravel.ubicacion_origen_lon || '');
      setUbicacionDestinoTexto(editingTravel.ubicacion_destino_texto || '');
      setUbicacionDestinoLat(editingTravel.ubicacion_destino_lat || '');
      setUbicacionDestinoLon(editingTravel.ubicacion_destino_lon || '');
      setEstado(editingTravel.estado || 'pendiente');
      setConductorId(editingTravel.conductor_id || '');
      setConductorNombre(editingTravel.conductor_nombre || '');
      setNotas(editingTravel.notas || '');
      setMessage(''); // Limpia mensajes globales al iniciar edición
      setError('');   // Limpia errores globales al iniciar edición
    } else {
      // Limpia el formulario para el modo de creación
      setPasajeroNombre('');
      setPasajeroTelefono('');
      setUbicacionOrigenTexto('');
      setUbicacionOrigenLat('');
      setUbicacionOrigenLon('');
      setUbicacionDestinoTexto('');
      setUbicacionDestinoLat('');
      setUbicacionDestinoLon('');
      setEstado('pendiente');
      setConductorId('');
      setConductorNombre('');
      setNotas('');
    }
  }, [editingTravel, setMessage, setError]); // Se ejecuta cuando editingTravel cambia

  /**
   * Maneja el envío del formulario para crear o actualizar un viaje.
   * @param {Event} e - El evento de envío del formulario.
   */
  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage('');
    setError('');

    // Validación básica de campos obligatorios
    if (!pasajeroNombre) {
      setError('El nombre del pasajero es obligatorio.');
      return;
    }
    if (!ubicacionOrigenTexto && (!ubicacionOrigenLat || !ubicacionOrigenLon)) {
      setError('Debe proporcionar una ubicación de origen (texto o coordenadas GPS).');
      return;
    }

    // Preparar los datos del viaje
    const travelData = {
      pasajero_nombre: pasajeroNombre,
      pasajero_telefono: pasajeroTelefono,
      ubicacion_origen_texto: ubicacionOrigenTexto,
      ubicacion_origen_lat: ubicacionOrigenLat ? parseFloat(ubicacionOrigenLat) : null,
      ubicacion_origen_lon: ubicacionOrigenLon ? parseFloat(ubicacionOrigenLon) : null,
      ubicacion_destino_texto: ubicacionDestinoTexto,
      ubicacion_destino_lat: ubicacionDestinoLat ? parseFloat(ubicacionDestinoLat) : null,
      ubicacion_destino_lon: ubicacionDestinoLon ? parseFloat(ubicacionDestinoLon) : null,
      estado: estado,
      conductor_id: conductorId || null,
      conductor_nombre: conductorNombre || null,
      notas: notas,
    };

    try {
      if (editingTravel) {
        // Modo edición: Petición PUT
        await axios.put(`http://localhost:5000/viajes/${editingTravel.id}`, travelData);
        setMessage(`Viaje para "${pasajeroNombre}" (ID: ${editingTravel.id}) actualizado exitosamente.`);
        onCancelEdit(); // Sale del modo edición
      } else {
        // Modo creación: Petición POST
        const response = await axios.post('http://localhost:5000/viajes', travelData);
        setMessage(`Viaje para "${response.data.id}" creado exitosamente.`);
      }

      // Limpiar el formulario después de un envío exitoso
      setPasajeroNombre('');
      setPasajeroTelefono('');
      setUbicacionOrigenTexto('');
      setUbicacionOrigenLat('');
      setUbicacionOrigenLon('');
      setUbicacionDestinoTexto('');
      setUbicacionDestinoLat('');
      setUbicacionDestinoLon('');
      setEstado('pendiente');
      setConductorId('');
      setConductorNombre('');
      setNotas('');

      if (onTravelCreated) {
        onTravelCreated(); // Notifica al padre para recargar la lista
      }

    } catch (err) {
      console.error("Error al procesar viaje:", err);
      const backendErrorMessage = err.response?.data?.error || err.message;
      setError(`Error al ${editingTravel ? 'actualizar' : 'crear'} el viaje: ${backendErrorMessage}.`);
    }
  };

  return (
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">
        {editingTravel ? 'Editar Viaje' : 'Crear Nuevo Viaje'}
      </h2>
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
              step="any"
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
              step="any"
              placeholder="Ej: -74.0721"
            />
          </div>
        </div>
        {/* Campo Ubicación de Destino (Texto) */}
        <div className="mb-4">
          <label htmlFor="ubicacionDestinoTexto" className="block text-gray-700 text-sm font-bold mb-2">Ubicación de Destino (Texto):</label>
          <input
            type="text"
            id="ubicacionDestinoTexto"
            value={ubicacionDestinoTexto}
            onChange={(e) => setUbicacionDestinoTexto(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
            placeholder="Ej: Centro Comercial, Bogotá"
          />
        </div>
        {/* Campos Ubicación de Destino (Latitud y Longitud) */}
        <div className="mb-4 flex gap-4">
          <div className="flex-1">
            <label htmlFor="ubicacionDestinoLat" className="block text-gray-700 text-sm font-bold mb-2">Latitud Destino GPS:</label>
            <input
              type="number"
              id="ubicacionDestinoLat"
              value={ubicacionDestinoLat}
              onChange={(e) => setUbicacionDestinoLat(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="any"
              placeholder="Ej: 4.7000"
            />
          </div>
          <div className="flex-1">
            <label htmlFor="ubicacionDestinoLon" className="block text-gray-700 text-sm font-bold mb-2">Longitud Destino GPS:</label>
            <input
              type="number"
              id="ubicacionDestinoLon"
              value={ubicacionDestinoLon}
              onChange={(e) => setUbicacionDestinoLon(e.target.value)}
              className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
              step="any"
              placeholder="Ej: -74.0500"
            />
          </div>
        </div>
        {/* Campo Estado del Viaje (Dropdown) */}
        <div className="mb-4">
          <label htmlFor="estado" className="block text-gray-700 text-sm font-bold mb-2">Estado:</label>
          <select
            id="estado"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
          >
            <option value="pendiente">Pendiente</option>
            <option value="asignado">Asignado</option>
            <option value="en_curso">En Curso</option>
            <option value="completado">Completado</option>
            <option value="cancelado">Cancelado</option>
          </select>
        </div>
        {/* Campo Conductor Asignado (solo si el estado no es pendiente) */}
        {estado !== 'pendiente' && (
          <>
            <div className="mb-4">
              <label htmlFor="conductorId" className="block text-gray-700 text-sm font-bold mb-2">ID Conductor Asignado:</label>
              <input
                type="text"
                id="conductorId"
                value={conductorId}
                onChange={(e) => setConductorId(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="ID del conductor"
              />
            </div>
            <div className="mb-4">
              <label htmlFor="conductorNombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre Conductor Asignado:</label>
              <input
                type="text"
                id="conductorNombre"
                value={conductorNombre}
                onChange={(e) => setConductorNombre(e.target.value)}
                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                placeholder="Nombre del conductor"
              />
            </div>
          </>
        )}
        {/* Campo Notas */}
        <div className="mb-6">
          <label htmlFor="notas" className="block text-gray-700 text-sm font-bold mb-2">Notas:</label>
          <textarea
            id="notas"
            value={notas}
            onChange={(e) => setNotas(e.target.value)}
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
            placeholder="Notas adicionales sobre el viaje..."
          ></textarea>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center justify-between">
          <button
            type="submit"
            className={`
              ${editingTravel ? 'bg-blue-600 hover:bg-blue-700' : 'bg-purple-600 hover:bg-purple-700'}
              text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-purple-500
            `}
          >
            {editingTravel ? 'Actualizar Viaje' : 'Crear Viaje'}
          </button>
          {editingTravel && (
            <button
              type="button"
              onClick={onCancelEdit}
              className="bg-gray-600 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Cancelar Edición
            </button>
          )}
        </div>
      </form>
    </div>
  );
}

export default TravelForm;
