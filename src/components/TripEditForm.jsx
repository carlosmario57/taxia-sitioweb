import React, { useState, useEffect } from 'react';
import axios from 'axios';

// Importaciones de React y Axios

// Componente TripEditForm: Permite editar un viaje existente.
const TripEditForm = ({ trip, onTripUpdated, onCancel, setGlobalMessage, setGlobalError }) => {
    // Estado para los datos del formulario del viaje.
    const [formData, setFormData] = useState({
        nombrePasajero: '',
        telefonoPasajero: '',
        ubicacionOrigen: '',
        latitudOrigen: '',
        longitudOrigen: '',
        ubicacionDestino: '',
        latitudDestino: '',
        longitudDestino: '',
        estado: 'pendiente', // Por defecto, el estado es 'pendiente'
        conductorAsignado: '',
        notas: '',
    });

    // Estado para la lista de conductores disponibles.
    const [drivers, setDrivers] = useState([]);
    const [loadingDrivers, setLoadingDrivers] = useState(true);
    const [driversError, setDriversError] = useState(null);
    
    // Estado para los mensajes de carga y error del formulario de edición.
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // useEffect para cargar la lista de conductores cuando se monta el componente.
    useEffect(() => {
        const fetchDrivers = async () => {
            try {
                // CORRECCIÓN IMPORTANTE: La URL debe apuntar a la ruta correcta del backend.
                const response = await axios.get('http://localhost:5000/drivers');
                setDrivers(response.data);
            } catch (err) {
                console.error("Error al obtener conductores:", err);
                const errorMessage = err.response?.data?.error || "Error al cargar la lista de conductores.";
                setDriversError(errorMessage);
                setGlobalError(errorMessage);
            } finally {
                setLoadingDrivers(false);
            }
        };
        fetchDrivers();
    }, [setGlobalError]); // Se ejecuta solo una vez al montar el componente.

    // useEffect para precargar los datos del viaje en el formulario.
    useEffect(() => {
        if (trip) {
            setFormData({
                nombrePasajero: trip.nombrePasajero || '',
                telefonoPasajero: trip.telefonoPasajero || '',
                ubicacionOrigen: trip.ubicacionOrigen || '',
                latitudOrigen: trip.latitudOrigen || '',
                longitudOrigen: trip.longitudOrigen || '',
                ubicacionDestino: trip.ubicacionDestino || '',
                latitudDestino: trip.latitudDestino || '',
                longitudDestino: trip.longitudDestino || '',
                estado: trip.estado || 'pendiente',
                conductorAsignado: trip.conductorAsignado || '',
                notas: trip.notas || '',
            });
        }
    }, [trip]);

    /**
     * Maneja el cambio en los campos del formulario.
     * @param {Object} e - Evento de cambio del input.
     */
    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }));
    };

    /**
     * Maneja el envío del formulario de edición del viaje.
     * @param {Object} e - Evento de envío del formulario.
     */
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            // Petición PUT para actualizar el viaje en el backend.
            await axios.put(`http://localhost:5000/trips/${trip.id}`, formData);
            setGlobalMessage('Viaje actualizado exitosamente!');
            setGlobalError('');
            onTripUpdated();
        } catch (err) {
            console.error("Error al actualizar viaje:", err);
            const errorMessage = err.response?.data?.error || "Error al actualizar el viaje. Inténtalo de nuevo.";
            setError(errorMessage);
            setGlobalError(errorMessage);
            setGlobalMessage('');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="p-6 border border-gray-200 rounded-lg shadow-xl bg-white w-full max-w-md mx-auto transform hover:scale-105 transition-transform duration-300">
            <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Editar Viaje</h2>
            {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
            
            <form onSubmit={handleSubmit} className="space-y-4">
                {/* Campo de Nombre del Pasajero */}
                <div>
                    <label htmlFor="nombrePasajero" className="block text-sm font-medium text-gray-700">Nombre del Pasajero</label>
                    <input
                        type="text"
                        id="nombrePasajero"
                        name="nombrePasajero"
                        value={formData.nombrePasajero}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Campo de Teléfono del Pasajero */}
                <div>
                    <label htmlFor="telefonoPasajero" className="block text-sm font-medium text-gray-700">Teléfono del Pasajero</label>
                    <input
                        type="text"
                        id="telefonoPasajero"
                        name="telefonoPasajero"
                        value={formData.telefonoPasajero}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Ubicación de Origen */}
                <div>
                    <label htmlFor="ubicacionOrigen" className="block text-sm font-medium text-gray-700">Ubicación de Origen</label>
                    <input
                        type="text"
                        id="ubicacionOrigen"
                        name="ubicacionOrigen"
                        value={formData.ubicacionOrigen}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Campos de Latitud y Longitud de Origen */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="latitudOrigen" className="block text-sm font-medium text-gray-700">Latitud GPS</label>
                        <input
                            type="text"
                            id="latitudOrigen"
                            name="latitudOrigen"
                            value={formData.latitudOrigen}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="longitudOrigen" className="block text-sm font-medium text-gray-700">Longitud GPS</label>
                        <input
                            type="text"
                            id="longitudOrigen"
                            name="longitudOrigen"
                            value={formData.longitudOrigen}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Ubicación de Destino */}
                <div>
                    <label htmlFor="ubicacionDestino" className="block text-sm font-medium text-gray-700">Ubicación de Destino</label>
                    <input
                        type="text"
                        id="ubicacionDestino"
                        name="ubicacionDestino"
                        value={formData.ubicacionDestino}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    />
                </div>

                {/* Campos de Latitud y Longitud de Destino */}
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label htmlFor="latitudDestino" className="block text-sm font-medium text-gray-700">Latitud GPS</label>
                        <input
                            type="text"
                            id="latitudDestino"
                            name="latitudDestino"
                            value={formData.latitudDestino}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="longitudDestino" className="block text-sm font-medium text-gray-700">Longitud GPS</label>
                        <input
                            type="text"
                            id="longitudDestino"
                            name="longitudDestino"
                            value={formData.longitudDestino}
                            onChange={handleInputChange}
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                        />
                    </div>
                </div>

                {/* Estado del Viaje */}
                <div>
                    <label htmlFor="estado" className="block text-sm font-medium text-gray-700">Estado</label>
                    <select
                        id="estado"
                        name="estado"
                        value={formData.estado}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        <option value="pendiente">Pendiente</option>
                        <option value="asignado">Asignado</option>
                        <option value="en_proceso">En Proceso</option>
                        <option value="completado">Completado</option>
                        <option value="cancelado">Cancelado</option>
                    </select>
                </div>

                {/* Asignar Conductor */}
                <div>
                    <label htmlFor="conductorAsignado" className="block text-sm font-medium text-gray-700">Asignar Conductor</label>
                    <select
                        id="conductorAsignado"
                        name="conductorAsignado"
                        value={formData.conductorAsignado}
                        onChange={handleInputChange}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    >
                        {loadingDrivers ? (
                            <option disabled>Cargando conductores...</option>
                        ) : driversError ? (
                            <option disabled>{driversError}</option>
                        ) : (
                            <>
                                <option value="">—Selecciona un conductor—</option>
                                {drivers.map(driver => (
                                    <option key={driver.id} value={driver.id}>
                                        {driver.nombre}
                                    </option>
                                ))}
                            </>
                        )}
                    </select>
                </div>

                {/* Notas Adicionales */}
                <div>
                    <label htmlFor="notas" className="block text-sm font-medium text-gray-700">Notas</label>
                    <textarea
                        id="notas"
                        name="notas"
                        value={formData.notas}
                        onChange={handleInputChange}
                        rows="3"
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                    ></textarea>
                </div>

                {/* Botones de acción */}
                <div className="flex justify-end gap-2 mt-6">
                    <button
                        type="button"
                        onClick={onCancel}
                        className="py-2 px-4 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                    >
                        Cancelar
                    </button>
                    <button
                        type="submit"
                        disabled={loading}
                        className="py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                        {loading ? 'Guardando...' : 'Guardar cambios'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default TripEditForm;