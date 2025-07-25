import React from 'react';

function TravelList({ travels }) {
    if (!travels || travels.length === 0) {
        return (
            <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
                <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">Lista de Viajes</h2>
                <p className="text-center text-gray-500 italic">No hay viajes registrados aún.</p>
            </div>
        );
    }

    return (
        <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md mx-auto">
            <h2 className="text-xl font-semibold text-center text-gray-800 mb-4">Lista de Viajes</h2>
            <ul className="list-none p-0">
                {travels.map(travel => (
                    <li key={travel.id} className="mb-4 p-4 border border-gray-300 rounded-md bg-gray-50 shadow-sm">
                        <p className="font-semibold text-gray-700">Pasajero: {travel.pasajero_nombre}</p>
                        <p className="text-sm text-gray-600">Teléfono: {travel.pasajero_telefono}</p>
                        <p className="text-sm text-gray-600">
                            Origen (Texto): {travel.ubicacion_origen_texto}
                            {travel.ubicacion_origen_lat && travel.ubicacion_origen_lon && (
                                <span className="text-purple-600 ml-2">(GPS: {travel.ubicacion_origen_lat}, {travel.ubicacion_origen_lon})</span>
                            )}
                        </p>
                        {travel.ubicacion_destino_texto && (
                            <p className="text-sm text-gray-600">
                                Destino (Texto): {travel.ubicacion_destino_texto}
                                {travel.ubicacion_destino_lat && travel.ubicacion_destino_lon && (
                                    <span className="text-purple-600 ml-2">(GPS: {travel.ubicacion_destino_lat}, {travel.ubicacion_destino_lon})</span>
                                )}
                            </p>
                        )}
                        <p className="text-sm text-gray-600">Estado: <span className="font-medium capitalize">{travel.estado}</span></p>
                        {travel.conductor_nombre && (
                            <p className="text-sm text-gray-600">Conductor Asignado: {travel.conductor_nombre}</p>
                        )}
                        {travel.fecha_solicitud && (
                            <p className="text-sm text-gray-600">Solicitado: {new Date(travel.fecha_solicitud).toLocaleString()}</p>
                        )}
                        {travel.fecha_asignacion && (
                            <p className="text-sm text-gray-600">Asignado: {new Date(travel.fecha_asignacion).toLocaleString()}</p>
                        )}
                        {travel.notas && (
                            <p className="text-sm text-gray-600">Notas: {travel.notas}</p>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default TravelList;