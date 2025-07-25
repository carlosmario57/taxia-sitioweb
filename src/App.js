import React, { useState, useEffect } from 'react';
import axios from 'axios';

import DriverForm from './DriverForm';
import DriverList from './DriverList';
import TravelForm from './TravelForm';
import TravelList from './TravelList';

import './App.css'; // Asegúrate de que este archivo esté vacío o contenga tus estilos globales

function App() {
  // --- Estados Globales para Mensajes y Errores ---
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // --- Estados de Datos ---
  const [drivers, setDrivers] = useState([]); // Los datos de conductores se mantendrán aquí o se pasarán como prop si DriverList los carga internamente
  const [travels, setTravels] = useState([]); // Los datos de viajes se mantendrán aquí o se pasarán como prop si TravelList los carga internamente
  const [editingDriver, setEditingDriver] = useState(null); // Conductor actualmente en edición

  // --- Funciones de Carga de Datos (App.js ahora delega más la carga a las listas) ---
  // fetchDrivers y fetchTravels serán llamadas por los componentes de lista,
  // y estos componentes actualizarán los estados globales de mensaje/error.

  // --- Funciones de Callback para DriverForm y DriverList ---

  // Se llama cuando se crea/actualiza un conductor desde DriverForm
  const handleDriverFormSubmit = () => {
    setEditingDriver(null); // Sale del modo edición
    // El DriverForm ya actualizará el setGlobalMessage/setGlobalError
    // Solo necesitamos que DriverList recargue sus datos.
    // Como DriverList tiene su propio fetchDrivers en useEffect,
    // al cambiar editingDriver a null, la lista debería auto-refrescarse
    // o si no, DriverForm llama directamente a fetchDrivers de DriverList
    // a través de una prop (que DriverList ya no tiene).
    // SOLUCION: DriverList llamará a fetchDrivers por sí mismo.
    // Y el mensaje lo gestionará DriverForm y App.js
  };

  // Se llama cuando se hace clic en "Editar" en DriverList
  const handleEditDriver = (driver) => {
    setEditingDriver(driver); // Establece el conductor a editar
    setGlobalMessage(''); // Limpia mensajes al iniciar edición
    setGlobalError('');   // Limpia errores al iniciar edición
  };

  // Se llama para cancelar la edición en DriverForm
  const handleCancelEdit = () => {
    setEditingDriver(null); // Sale del modo edición
    setGlobalMessage(''); // Limpia mensajes
    setGlobalError('');   // Limpia errores
  };

  // Se llama cuando se elimina un conductor desde DriverList
  // DriverList ya maneja su propio mensaje de eliminación y actualiza los estados globales
  const handleDriverDeleted = () => {
    // DriverList ya llama a setGlobalMessage/setGlobalError internamente
    // Solo necesitamos que DriverList se actualice, lo cual hace al llamar a fetchDrivers internamente
  };

  // --- Función de Callback para TravelForm ---
  const handleTravelFormSubmit = () => {
    // TravelForm ya actualizará el setGlobalMessage/setGlobalError
    // TravelList tiene su propio fetchTravels.
  };


  // --- Renderizado del Componente Principal ---
  return (
    // Contenedor principal de la aplicación con estilos Tailwind
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-sans antialiased">

      {/* Encabezado */}
      <header className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6 mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2">CIMCO Operations</h1>
        <p className="text-xl text-gray-600">Gestión Centralizada de Conductores y Viajes</p>
      </header>

      {/* Mensajes Globales (éxito/error) */}
      {globalMessage && (
        <p className="w-full max-w-4xl px-6 py-3 mb-4 text-center bg-green-100 text-green-700 rounded-lg shadow-sm font-medium">
          {globalMessage}
        </p>
      )}
      {globalError && (
        <p className="w-full max-w-4xl px-6 py-3 mb-4 text-center bg-red-100 text-red-700 rounded-lg shadow-sm font-medium">
          {globalError}
        </p>
      )}

      {/* Contenido Principal: Formularios y Listas */}
      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4">

        {/* Sección de Gestión de Conductores */}
        <section className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Conductores</h2>
          <DriverForm
            onDriverCreated={handleDriverFormSubmit} // Llama a esto para resetear la edición y limpiar mensajes
            editingDriver={editingDriver}
            onCancelEdit={handleCancelEdit}
            setMessage={setGlobalMessage} // Pasa el setter de mensaje global
            setError={setGlobalError}     // Pasa el setter de error global
            // No pasamos message/error como prop a DriverForm, ya que él gestiona su feedback localmente
            // y luego App.js mostrará el mensaje global
          />
          <DriverList
            onEditDriver={handleEditDriver}
            onDriverDeleted={handleDriverDeleted} // Llama a esto para recargar la lista
            setGlobalMessage={setGlobalMessage} // Pasa el setter de mensaje global
            setGlobalError={setGlobalError}   // Pasa el setter de error global
          />
        </section>

        {/* Sección de Gestión de Viajes */}
        <section className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Viajes</h2>
          <TravelForm 
            onTravelCreated={handleTravelFormSubmit} 
            setMessage={setGlobalMessage} // Pasa el setter de mensaje global
            setError={setGlobalError}     // Pasa el setter de error global
          />
          <TravelList 
            // TravelList tiene su propia lógica de carga y estados internos
            setGlobalMessage={setGlobalMessage} // Pasa el setter de mensaje global
            setGlobalError={setGlobalError}     // Pasa el setter de error global
          />
        </section>
      </main>
    </div>
  );
}

export default App;