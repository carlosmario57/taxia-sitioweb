import React, { useState } from 'react';
import axios from 'axios'; // Aunque axios no se usa directamente aquí, se mantiene por si se añade lógica global de fetching

import DriverForm from './DriverForm';
import DriverList from './DriverList';
import TravelForm from './TravelForm';
import TravelList from './TravelList';

import './App.css'; // Asegúrate de que este archivo esté vacío o contenga tus estilos globales

function App() {
  // --- Estados Globales para Mensajes y Errores ---
  // Estos estados serán actualizados por los componentes hijos (DriverForm, DriverList, TravelForm, TravelList)
  // para mostrar retroalimentación al usuario en la parte superior del panel.
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // --- Estados para Edición ---
  const [editingDriver, setEditingDriver] = useState(null); // Conductor actualmente en edición
  const [editingTravel, setEditingTravel] = useState(null);   // Viaje actualmente en edición

  // --- Estados para Forzar Recarga de Listas (Actualización Automática) ---
  // Estos keys se incrementan para forzar un re-render y re-fetch en los useEffect de las listas
  const [refreshDriversKey, setRefreshDriversKey] = useState(0);
  const [refreshTravelsKey, setRefreshTravelsKey] = useState(0);

  // --- Funciones de Callback para DriverForm y DriverList ---

  // Se llama cuando se crea o actualiza un conductor desde DriverForm
  const handleDriverFormSubmit = () => {
    setEditingDriver(null); // Sale del modo edición en el formulario
    setRefreshDriversKey(prevKey => prevKey + 1); // Fuerza la recarga de DriverList
    // IMPORTANTE: NO TOCAMOS setGlobalMessage aquí. DriverForm ya lo estableció.
    // Solo limpiamos el error si lo hubiera.
    setGlobalError(''); 
  };

  // Se llama cuando se hace clic en "Editar" en DriverList
  const handleEditDriver = (driver) => {
    setEditingDriver(driver); // Establece el conductor a editar en el formulario
    setGlobalMessage('');      // Limpia mensajes globales al iniciar edición
    setGlobalError('');        // Limpia errores globales al iniciar edición
  };

  // Se llama para cancelar la edición en DriverForm
  const handleCancelEditDriver = () => { 
    setEditingDriver(null); // Sale del modo edición en el formulario
    setGlobalMessage('');    // Limpia mensajes
    setGlobalError('');      // Limpia errores
  };

  // Se llama cuando se elimina un conductor desde DriverList
  const handleDriverDeleted = () => {
    setRefreshDriversKey(prevKey => prevKey + 1); // Fuerza la recarga de DriverList
    // DriverList ya gestiona su propio mensaje de éxito/error de eliminación y lo propaga globalmente
  };

  // --- Funciones de Callback para TravelForm y TravelList ---

  // Se llama cuando se crea o actualiza un viaje desde TravelForm
  const handleTravelFormSubmit = () => {
    setEditingTravel(null); // Sale del modo edición en el formulario de viajes
    setRefreshTravelsKey(prevKey => prevKey + 1); // Fuerza la recarga de TravelList
    // IMPORTANTE: NO TOCAMOS setGlobalMessage aquí. TravelForm ya lo estableció.
    // Solo limpiamos el error si lo hubiera.
    setGlobalError('');
  };

  // Se llama cuando se hace clic en "Editar" en TravelList
  const handleEditTravel = (travel) => {
    setEditingTravel(travel); // Establece el viaje a editar en el formulario
    setGlobalMessage('');      // Limpia mensajes globales al iniciar edición
    setGlobalError('');        // Limpia errores globales al iniciar edición
  };

  // Se llama para cancelar la edición en TravelForm
  const handleCancelEditTravel = () => {
    setEditingTravel(null); // Sale del modo edición en el formulario de viajes
    setGlobalMessage('');    // Limpia mensajes
    setGlobalError('');      // Limpia errores
  };

  // Se llama cuando se elimina un viaje desde TravelList
  const handleTravelDeleted = () => {
    setRefreshTravelsKey(prevKey => prevKey + 1); // Fuerza la recarga de TravelList
    // TravelList ya gestiona su propio mensaje de éxito/error de eliminación y lo propaga globalmente
  };


  // --- Renderizado del Componente Principal ---
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-sans antialiased">
      
      {/* Encabezado del Panel */}
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
            onDriverCreated={handleDriverFormSubmit}
            editingDriver={editingDriver}
            onCancelEdit={handleCancelEditDriver}
            setMessage={setGlobalMessage}
            setError={setGlobalError}
          />
          <DriverList
            key={refreshDriversKey} // ¡IMPORTANTE! Este key fuerza el re-render y re-fetch
            onEditDriver={handleEditDriver}
            onDriverDeleted={handleDriverDeleted}
            setGlobalMessage={setGlobalMessage}
            setGlobalError={setGlobalError}
          />
        </section>

        {/* Sección de Gestión de Viajes */}
        <section className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Viajes</h2>
          <TravelForm 
            onTravelCreated={handleTravelFormSubmit}
            editingTravel={editingTravel} // Pasa el viaje a editar
            onCancelEdit={handleCancelEditTravel} // Pasa la función para cancelar la edición
            setMessage={setGlobalMessage}
            setError={setGlobalError}
          />
          <TravelList 
            key={refreshTravelsKey} // ¡IMPORTANTE! Este key fuerza el re-render y re-fetch
            onEditTravel={handleEditTravel} // Pasa la función para editar viajes
            onTravelDeleted={handleTravelDeleted} // Pasa la función para eliminar viajes
            setGlobalMessage={setGlobalMessage} 
            setGlobalError={setGlobalError}     
          />
        </section>
      </main>
    </div>
  );
}

export default App;
