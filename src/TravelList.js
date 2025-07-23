import React from 'react';

function TravelList({ travels }) {
  if (!travels || travels.length === 0) {
    return (
      <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Viajes</h2>
        <p className="text-center text-gray-500 italic">No hay viajes registrados aún.</p>
      </div>
    );
  }

  return (
    <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-md">
      <h2 className="text-2xl font-semibold text-gray-800 mb-6 text-center">Lista de Viajes</h2>
      <ul className="list-none p-0">
        {travels.map(travel => (
          <li key={travel.id} className="mb-4 p-4 border border-gray-200 rounded-lg bg-gray-50 shadow-sm flex flex-col">
            <div className="mb-2 text-gray-700">
              <strong className="text-purple-600">Pasajero:</strong> {travel.pasajero_nombre} <br />
              <strong className="text-purple-600">Teléfono:</strong> {travel.pasajero_telefono || 'N/A'} <br />
              <strong className="text-purple-600">Origen (Texto):</strong> {travel.ubicacion_origen_texto || 'N/A'} <br />
              {/* ATENCIÓN: Escribe estas dos líneas con CUIDADO EXTREMO */}
              {travel.ubicacion_origen_lat && travel.ubicacion_origen_lon && (
                <strong className="text-purple-600">Origen (GPS):</strong> {travel.ubicacion_origen_lat}, {travel.ubicacion_origen_lon} <br />
              )}
              {/* Escribe estas dos líneas con CUIDADO EXTREMO */}
              {travel.ubicacion_destino_texto && (
                <strong className="text-purple-600">Destino (Texto):</strong> {travel.ubicacion_destino_texto} <br />
              )}
              {/* Escribe estas dos líneas con CUIDADO EXTREMO */}
              {travel.ubicacion_destino_lat && travel.ubicacion_destino_lon && (
                <strong className="text-purple-600">Destino (GPS):</strong> {travel.ubicacion_destino_lat}, {travel.ubicacion_destino_lon} <br />
              )}
              <strong className="text-purple-600">Estado:</strong> <span className={`font-semibold ${travel.estado === 'pendiente' ? 'text-orange-500' : 'text-blue-500'}`}>{travel.estado}</span> <br />
              <strong className="text-purple-600">Conductor Asignado:</strong> {travel.conductor_nombre || 'Pendiente'} <br />
              {travel.fecha_solicitud && (
                <strong className="text-purple-600">Solicitado:</strong> {new Date(travel.fecha_solicitud._seconds * 1000).toLocaleString()}
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default TravelList;