import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth'; // Importa getAuth para interactuar con Firebase Auth

/**
 * Componente funcional para la creación y edición de viajes.
 * @param {Object} props - Las propiedades del componente.
 * @param {Function} props.onTravelCreated - Callback que se ejecuta cuando un viaje es creado o actualizado exitosamente.
 * @param {Object|null} props.editingTravel - Objeto de viaje si se está editando, de lo contrario null.
 * @param {Function} props.onCancelEdit - Callback para cancelar el modo de edición.
 * @param {Function} props.setMessage - Función para mostrar mensajes de éxito globales.
 * @param {Function} props.setError - Función para mostrar mensajes de error globales.
 */
function TravelForm({ onTravelCreated, editingTravel, onCancelEdit, setMessage, setError }) {
    // --- Estados del formulario de viaje ---
    const [travelData, setTravelData] = useState({
        pasajero_nombre: '',
        pasajero_telefono: '',
        ubicacion_origen_texto: '',
        ubicacion_origen_lat: '',
        ubicacion_origen_lon: '',
        ubicacion_destino_texto: '',
        ubicacion_destino_lat: '',
        ubicacion_destino_lon: '',
        estado: 'pendiente',
        conductor_id: null, // Inicialmente null, no string vacío
        conductor_nombre: null, // Inicialmente null
        notas: ''
    });

    // --- Estados de UI y datos auxiliares ---
    const [loading, setLoading] = useState(false); // Para el estado de envío del formulario
    const [drivers, setDrivers] = useState([]); // Almacena la lista de conductores
    const [driversLoading, setDriversLoading] = useState(true); // Indica si los conductores están cargando

    // --- Efecto para precargar datos cuando editingTravel cambia ---
    // Este useEffect se encarga de rellenar el formulario cuando se selecciona un viaje para editar
    // o de resetearlo cuando se cancela la edición o se crea uno nuevo.
    useEffect(() => {
        if (editingTravel) {
            setTravelData({
                pasajero_nombre: editingTravel.pasajero_nombre || '',
                pasajero_telefono: editingTravel.pasajero_telefono || '',
                ubicacion_origen_texto: editingTravel.ubicacion_origen_texto || '',
                ubicacion_origen_lat: editingTravel.ubicacion_origen_lat || '',
                ubicacion_origen_lon: editingTravel.ubicacion_origen_lon || '',
                ubicacion_destino_texto: editingTravel.ubicacion_destino_texto || '',
                ubicacion_destino_lat: editingTravel.ubicacion_destino_lat || '',
                ubicacion_destino_lon: editingTravel.ubicacion_destino_lon || '',
                estado: editingTravel.estado || 'pendiente',
                // Asegúrate de que conductor_id sea un número o null
                conductor_id: editingTravel.conductor_id || null,
                conductor_nombre: editingTravel.conductor_nombre || null,
                notas: editingTravel.notas || ''
            });
            setMessage('');
            setError('');
        } else {
            // Resetear el formulario a su estado inicial para un nuevo viaje
            setTravelData({
                pasajero_nombre: '',
                pasajero_telefono: '',
                ubicacion_origen_texto: '',
                ubicacion_origen_lat: '',
                ubicacion_origen_lon: '',
                ubicacion_destino_texto: '',
                ubicacion_destino_lat: '',
                ubicacion_destino_lon: '',
                estado: 'pendiente',
                conductor_id: null,
                conductor_nombre: null,
                notas: ''
            });
        }
    }, [editingTravel, setMessage, setError]);

    // --- Función para cargar los conductores (memoizada con useCallback) ---
    // Usamos useCallback para que esta función no se recree en cada render,
    // lo que puede ser útil para optimizaciones si se pasara a componentes hijos.
    const fetchDrivers = useCallback(async () => {
        setDriversLoading(true);
        setError(''); // Limpiar errores previos específicos de carga

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                // Si no hay usuario logueado, no se pueden cargar conductores
                setError('Debes iniciar sesión para cargar la lista de conductores.');
                setDriversLoading(false);
                setDrivers([]); // Asegurarse de que la lista esté vacía si no hay sesión
                return;
            }

            const idToken = await user.getIdToken();
            const response = await axios.get('http://localhost:5000/drivers', {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            });
            setDrivers(response.data);
        } catch (err) {
            console.error("Error al cargar conductores:", err);
            const errorMessage = err.response?.data?.error || "Error al cargar la lista de conductores. Intenta recargar la página.";
            setError(errorMessage);
            setDrivers([]); // Asegurarse de que la lista esté vacía en caso de error
        } finally {
            setDriversLoading(false);
        }
    }, [setError]);

    // --- Efecto para cargar los conductores una vez al montar el componente ---
    // Se ejecuta solo una vez al inicio debido al array de dependencias vacío `[]`.
    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]); // Dependencia: fetchDrivers (se pasa useCallback para que no se re-ejecute innecesariamente)

    // --- Handler genérico para cambios en los campos del formulario ---
    const handleChange = (e) => {
        const { id, value } = e.target;
        setTravelData(prevData => ({
            ...prevData,
            [id]: value
        }));
    };

    // --- Handler específico para la selección de conductor ---
    const handleConductorChange = (e) => {
        const selectedId = e.target.value;
        const selectedDriver = drivers.find(d => d.id.toString() === selectedId);

        setTravelData(prevData => ({
            ...prevData,
            // Convertir a número o null. Si selectedId es '', parseInt('') es NaN, !NaN es true, entonces es null
            conductor_id: selectedId ? parseInt(selectedId, 10) : null,
            conductor_nombre: selectedDriver ? selectedDriver.nombre : null,
            // Si desasignamos un conductor, el estado debería volver a 'pendiente'
            estado: selectedId ? prevData.estado : 'pendiente'
        }));
    };

    // --- Handler para el envío del formulario ---
    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

        // --- Validaciones Frontend ---
        if (!travelData.pasajero_nombre.trim()) {
            setError('El nombre del pasajero es obligatorio.');
            return;
        }
        if (!travelData.pasajero_telefono.trim()) {
            setError('El teléfono del pasajero es obligatorio.');
            return;
        } else if (!/^\d{7,15}$/.test(travelData.pasajero_telefono.trim())) {
            setError('El teléfono debe contener solo números (7-15 dígitos).');
            return;
        }
        if (!travelData.ubicacion_origen_texto.trim() && (!travelData.ubicacion_origen_lat && !travelData.ubicacion_origen_lon)) {
            setError('Debe proporcionar una ubicación de origen (texto o coordenadas GPS).');
            return;
        }
        if (travelData.estado !== 'pendiente' && !travelData.conductor_id) {
            setError('Si el estado no es "pendiente", debes asignar un conductor.');
            return;
        }

        setLoading(true);

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                setError('Debes iniciar sesión para realizar esta operación.');
                setLoading(false);
                return;
            }

            const idToken = await user.getIdToken();

            // Preparar los datos finales para enviar al backend
            const dataToSend = {
                ...travelData,
                pasajero_nombre: travelData.pasajero_nombre.trim(),
                pasajero_telefono: travelData.pasajero_telefono.trim(),
                ubicacion_origen_texto: travelData.ubicacion_origen_texto.trim(),
                ubicacion_destino_texto: travelData.ubicacion_destino_texto.trim(),
                notas: travelData.notas.trim(),
                // Asegurarse de que las coordenadas sean números o null
                ubicacion_origen_lat: travelData.ubicacion_origen_lat ? parseFloat(travelData.ubicacion_origen_lat) : null,
                ubicacion_origen_lon: travelData.ubicacion_origen_lon ? parseFloat(travelData.ubicacion_origen_lon) : null,
                ubicacion_destino_lat: travelData.ubicacion_destino_lat ? parseFloat(travelData.ubicacion_destino_lat) : null,
                ubicacion_destino_lon: travelData.ubicacion_destino_lon ? parseFloat(travelData.ubicacion_destino_lon) : null,
            };

            const axiosConfig = {
                headers: {
                    'Authorization': `Bearer ${idToken}`
                }
            };

            if (editingTravel) {
                // Si estamos editando, usamos PUT
                await axios.put(`http://localhost:5000/viajes/${editingTravel.id}`, dataToSend, axiosConfig);
                setMessage(`Viaje para "${dataToSend.pasajero_nombre}" (ID: ${editingTravel.id}) actualizado exitosamente.`);
            } else {
                // Si estamos creando, usamos POST
                const response = await axios.post('http://localhost:5000/viajes', dataToSend, axiosConfig);
                setMessage(`Viaje para "${response.data.id}" creado exitosamente.`);
            }

            // Limpiar el formulario y notificar al componente padre
            onTravelCreated(); // Llama al callback para refrescar la lista de viajes
            if (editingTravel) {
                onCancelEdit(); // Sale del modo edición
            }

        } catch (err) {
            console.error("Error al procesar viaje:", err);
            let errorMessage = `Error al ${editingTravel ? 'actualizar' : 'crear'} el viaje: `;
            if (err.response) {
                // Errores del servidor (HTTP 4xx, 5xx)
                if (err.response.data && err.response.data.error) {
                    errorMessage += err.response.data.error;
                } else if (err.response.data && typeof err.response.data === 'string') {
                    errorMessage += err.response.data;
                } else {
                    errorMessage += `Código ${err.response.status} - ${err.response.statusText}`;
                }
            } else if (err.request) {
                // Error de red (el servidor no respondió)
                errorMessage += 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo y sea accesible.';
            } else {
                // Otros errores (ej. configuración de Axios, error en el código JS)
                errorMessage += err.message;
            }
            setError(errorMessage);
        } finally {
            setLoading(false);
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
                    <label htmlFor="pasajero_nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Pasajero:</label>
                    <input
                        type="text"
                        id="pasajero_nombre"
                        name="pasajero_nombre" // Añadir name para mejor manejo si usaras un solo handleChange
                        value={travelData.pasajero_nombre}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                    />
                </div>
                {/* Campo Teléfono del Pasajero */}
                <div className="mb-4">
                    <label htmlFor="pasajero_telefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono del Pasajero:</label>
                    <input
                        type="tel" // Usar type="tel" para teléfonos
                        id="pasajero_telefono"
                        name="pasajero_telefono"
                        value={travelData.pasajero_telefono}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                        pattern="[0-9]{7,15}"
                        title="Ingresa solo números (7-15 dígitos)"
                    />
                </div>
                {/* Campo Ubicación de Origen (Texto) */}
                <div className="mb-4">
                    <label htmlFor="ubicacion_origen_texto" className="block text-gray-700 text-sm font-bold mb-2">Ubicación de Origen (Texto):</label>
                    <input
                        type="text"
                        id="ubicacion_origen_texto"
                        name="ubicacion_origen_texto"
                        value={travelData.ubicacion_origen_texto}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej: Calle 10 # 5-20, cerca del parque"
                        required
                    />
                </div>
                {/* Campos Ubicación de Origen (Latitud y Longitud) */}
                <div className="mb-4 flex gap-4">
                    <div className="flex-1">
                        <label htmlFor="ubicacion_origen_lat" className="block text-gray-700 text-sm font-bold mb-2">Latitud GPS:</label>
                        <input
                            type="number"
                            id="ubicacion_origen_lat"
                            name="ubicacion_origen_lat"
                            value={travelData.ubicacion_origen_lat}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                            step="any"
                            placeholder="Ej: 4.7110"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="ubicacion_origen_lon" className="block text-gray-700 text-sm font-bold mb-2">Longitud GPS:</label>
                        <input
                            type="number"
                            id="ubicacion_origen_lon"
                            name="ubicacion_origen_lon"
                            value={travelData.ubicacion_origen_lon}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                            step="any"
                            placeholder="Ej: -74.0721"
                        />
                    </div>
                </div>
                {/* Campo Ubicación de Destino (Texto) */}
                <div className="mb-4">
                    <label htmlFor="ubicacion_destino_texto" className="block text-gray-700 text-sm font-bold mb-2">Ubicación de Destino (Texto):</label>
                    <input
                        type="text"
                        id="ubicacion_destino_texto"
                        name="ubicacion_destino_texto"
                        value={travelData.ubicacion_destino_texto}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Ej: Centro Comercial, Bogotá"
                        required
                    />
                </div>
                {/* Campos Ubicación de Destino (Latitud y Longitud) */}
                <div className="mb-4 flex gap-4">
                    <div className="flex-1">
                        <label htmlFor="ubicacion_destino_lat" className="block text-gray-700 text-sm font-bold mb-2">Latitud Destino GPS:</label>
                        <input
                            type="number"
                            id="ubicacion_destino_lat"
                            name="ubicacion_destino_lat"
                            value={travelData.ubicacion_destino_lat}
                            onChange={handleChange}
                            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                            step="any"
                            placeholder="Ej: 4.7000"
                        />
                    </div>
                    <div className="flex-1">
                        <label htmlFor="ubicacion_destino_lon" className="block text-gray-700 text-sm font-bold mb-2">Longitud Destino GPS:</label>
                        <input
                            type="number"
                            id="ubicacion_destino_lon"
                            name="ubicacion_destino_lon"
                            value={travelData.ubicacion_destino_lon}
                            onChange={handleChange}
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
                        name="estado"
                        value={travelData.estado}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                    >
                        <option value="pendiente">Pendiente</option>
                        <option value="asignado">Asignado</option>
                        <option value="en_curso">En Curso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                {/* Campo de selección de Conductor Asignado */}
                {/* Se muestra si el estado no es 'pendiente' O si ya tiene un conductor asignado */}
                {(travelData.estado !== 'pendiente' || travelData.conductor_id) && (
                    <div className="mb-4">
                        <label htmlFor="conductor_id" className="block text-gray-700 text-sm font-bold mb-2">Asignar Conductor:</label>
                        {driversLoading ? (
                            <p className="text-gray-500">Cargando conductores...</p>
                        ) : drivers.length === 0 ? (
                            <p className="text-red-500 text-sm">No hay conductores disponibles. Asegúrate de crear conductores primero.</p>
                        ) : (
                            <select
                                id="conductor_id"
                                name="conductor_id"
                                // Asegúrate de que el valor sea un string para el select
                                value={travelData.conductor_id ? travelData.conductor_id.toString() : ''}
                                onChange={handleConductorChange}
                                className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                            >
                                <option value="">-- Selecciona un conductor --</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id.toString()}>
                                        {driver.nombre} ({driver.tipo_vehiculo})
                                    </option>
                                ))}
                            </select>
                        )}
                        {travelData.conductor_id && <p className="text-gray-600 text-sm mt-1">Conductor actual: {travelData.conductor_nombre}</p>}
                    </div>
                )}

                {/* Campo Notas */}
                <div className="mb-6">
                    <label htmlFor="notas" className="block text-gray-700 text-sm font-bold mb-2">Notas:</label>
                    <textarea
                        id="notas"
                        name="notas"
                        value={travelData.notas}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500 h-24 resize-none"
                        placeholder="Notas adicionales sobre el viaje..."
                    ></textarea>
                </div>

                {/* Botones de acción */}
                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        disabled={loading}
                        className={`
                            ${editingTravel ? 'bg-blue-600 hover:bg-blue-700 focus:ring-blue-500' : 'bg-purple-600 hover:bg-purple-700 focus:ring-purple-500'}
                            text-white font-bold py-2 px-6 rounded focus:outline-none focus:shadow-outline transition duration-150 ease-in-out focus:ring-2 focus:ring-offset-2
                            ${loading ? 'opacity-50 cursor-not-allowed' : ''}
                        `}
                    >
                        {loading ? (editingTravel ? 'Actualizando...' : 'Creando...') : (editingTravel ? 'Actualizar Viaje' : 'Crear Viaje')}
                    </button>
                    {editingTravel && (
                        <button
                            type="button"
                            onClick={onCancelEdit}
                            disabled={loading}
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