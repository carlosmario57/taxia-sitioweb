import React, { useState, useEffect, useCallback } from 'react';
import axios from 'axios';
import { getAuth } from 'firebase/auth';

function TravelForm({ onTravelCreated, editingTravel, onCancelEdit, setMessage, setError }) {
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
        conductor_id: null,
        conductor_nombre: null,
        notas: ''
    });

    const [loading, setLoading] = useState(false);
    const [drivers, setDrivers] = useState([]);
    const [driversLoading, setDriversLoading] = useState(true);

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
                conductor_id: editingTravel.conductor_id || null,
                conductor_nombre: editingTravel.conductor_nombre || null,
                notas: editingTravel.notas || ''
            });
            setMessage('');
            setError('');
        } else {
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

    const fetchDrivers = useCallback(async () => {
        setDriversLoading(true);
        setError('');

        try {
            const auth = getAuth();
            const user = auth.currentUser;

            if (!user) {
                setError('Debes iniciar sesión para cargar la lista de conductores.');
                setDriversLoading(false);
                setDrivers([]);
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
            setDrivers([]);
        } finally {
            setDriversLoading(false);
        }
    }, [setError]);

    useEffect(() => {
        fetchDrivers();
    }, [fetchDrivers]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setTravelData(prevData => ({
            ...prevData,
            [id]: value
        }));
    };

    const handleConductorChange = (e) => {
        const selectedId = e.target.value;
        const selectedDriver = drivers.find(d => d.id.toString() === selectedId);

        setTravelData(prevData => ({
            ...prevData,
            conductor_id: selectedId ? parseInt(selectedId, 10) : null,
            conductor_nombre: selectedDriver ? selectedDriver.nombre : null,
            estado: selectedId ? prevData.estado : 'pendiente'
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        setMessage('');
        setError('');

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

            const dataToSend = {
                ...travelData,
                pasajero_nombre: travelData.pasajero_nombre.trim(),
                pasajero_telefono: travelData.pasajero_telefono.trim(),
                ubicacion_origen_texto: travelData.ubicacion_origen_texto.trim(),
                ubicacion_destino_texto: travelData.ubicacion_destino_texto.trim(),
                notas: travelData.notas.trim(),
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
                await axios.put(`http://localhost:5000/viajes/${editingTravel.id}`, dataToSend, axiosConfig);
                setMessage(`Viaje para "${dataToSend.pasajero_nombre}" (ID: ${editingTravel.id}) actualizado exitosamente.`);
            } else {
                const response = await axios.post('http://localhost:5000/viajes', dataToSend, axiosConfig);
                setMessage(`Viaje para "${response.data.id}" creado exitosamente.`);
            }

            onTravelCreated();
            if (editingTravel) {
                onCancelEdit();
            }

        } catch (err) {
            console.error("Error al procesar viaje:", err);
            let errorMessage = `Error al ${editingTravel ? 'actualizar' : 'crear'} el viaje: `;
            if (err.response) {
                if (err.response.data && err.response.data.error) {
                    errorMessage += err.response.data.error;
                } else if (err.response.data && typeof err.response.data === 'string') {
                    errorMessage += err.response.data;
                } else {
                    errorMessage += `Código ${err.response.status} - ${err.response.statusText}`;
                }
            } else if (err.request) {
                errorMessage += 'No se pudo conectar con el servidor. Verifica que el backend esté corriendo y sea accesible.';
            } else {
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
                <div className="mb-4">
                    <label htmlFor="pasajero_nombre" className="block text-gray-700 text-sm font-bold mb-2">Nombre del Pasajero:</label>
                    <input
                        type="text"
                        id="pasajero_nombre"
                        name="pasajero_nombre"
                        value={travelData.pasajero_nombre}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:ring-2 focus:ring-purple-500"
                        required
                    />
                </div>
                <div className="mb-4">
                    <label htmlFor="pasajero_telefono" className="block text-gray-700 text-sm font-bold mb-2">Teléfono del Pasajero:</label>
                    <input
                        type="tel"
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