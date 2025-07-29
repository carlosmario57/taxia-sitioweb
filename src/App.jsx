import React, { useState } from 'react'; // Asegúrate de que solo haya imports de React y Hooks
// import axios from 'axios'; // Se ha eliminado, ya que no se usa directamente en este componente

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
  const [editingDriver, setEditingDriver] = useState(null);   // Conductor actualmente en edición
  const [editingTravel, setEditingTravel] = useState(null);    // Viaje actualmente en edición

  // --- Estados para Forzar Recarga de Listas (Actualización Automática) ---
  // Estos 'key' se incrementan para forzar un re-render y re-fetch en los useEffect de las listas
  const [refreshDriversKey, setRefreshDriversKey] = useState(0);
  const [refreshTravelsKey, setRefreshTravelsKey] = useState(0);

  // --- Funciones de Callback para DriverForm y DriverList ---

  /**
   * Callback que se llama cuando una operación de DriverForm (crear/actualizar) se completa.
   * Limpia el estado de edición y fuerza la recarga de la lista de conductores.
   */
  const handleDriverFormSubmit = () => {
    setEditingDriver(null); // Sale del modo edición en el formulario
    setRefreshDriversKey(prevKey => prevKey + 1); // Fuerza la recarga de DriverList
    // Los mensajes globales (éxito/error) ya los gestiona DriverForm directamente a través de setMessage/setError props.
  };

  /**
   * Callback que se llama cuando se hace clic en "Editar" en DriverList.
   * Establece el conductor a editar y limpia los mensajes globales.
   * @param {Object} driver - El objeto conductor a editar.
   */
  const handleEditDriver = (driver) => {
    setEditingDriver(driver); // Establece el conductor a editar en el formulario
    setGlobalMessage('');      // Limpia mensajes globales al iniciar edición
    setGlobalError('');        // Limpia errores globales al iniciar edición
  };

  /**
   * Callback que se llama para cancelar la edición de un conductor desde DriverForm.
   * Limpia el estado de edición y los mensajes globales.
   */
  const handleCancelEditDriver = () => {
    setEditingDriver(null); // Sale del modo edición en el formulario
    setGlobalMessage('');    // Limpia mensajes
    setGlobalError('');      // Limpia errores
  };

  /**
   * Callback que se llama cuando un conductor es eliminado desde DriverList.
   * Fuerza la recarga de la lista de conductores.
   */
  const handleDriverDeleted = () => {
    setRefreshDriversKey(prevKey => prevKey + 1); // Fuerza la recarga de DriverList
    // Los mensajes globales (éxito/error) ya los gestiona DriverList directamente.
  };

  // --- Funciones de Callback para TravelForm y TravelList ---

  /**
   * Callback que se llama cuando una operación de TravelForm (crear/actualizar) se completa.
   * Limpia el estado de edición y fuerza la recarga de la lista de viajes.
   */
  const handleTravelFormSubmit = () => {
    setEditingTravel(null); // Sale del modo edición en el formulario de viajes
    setRefreshTravelsKey(prevKey => prevKey + 1); // Fuerza la recarga de TravelList
    // Los mensajes globales (éxito/error) ya los gestiona TravelForm directamente.
  };

  /**
   * Callback que se llama cuando se hace clic en "Editar" en TravelList.
   * Establece el viaje a editar y limpia los mensajes globales.
   * @param {Object} travel - El objeto viaje a editar.
   */
  const handleEditTravel = (travel) => {
    setEditingTravel(travel); // Establece el viaje a editar en el formulario
    setGlobalMessage('');      // Limpia mensajes globales al iniciar edición
    setGlobalError('');        // Limpia errores globales al iniciar edición
  };

  /**
   * Callback que se llama para cancelar la edición de un viaje desde TravelForm.
   * Limpia el estado de edición y los mensajes globales.
   */
  const handleCancelEditTravel = () => {
    setEditingTravel(null); // Sale del modo edición en el formulario de viajes
    setGlobalMessage('');    // Limpia mensajes
    setGlobalError('');      // Limpia errores
  };

  /**
   * Callback que se llama cuando un viaje es eliminado desde TravelList.
   * Fuerza la recarga de la lista de viajes.
   */
  const handleTravelDeleted = () => {
    setRefreshTravelsKey(prevKey => prevKey + 1); // Fuerza la recarga de TravelList
    // Los mensajes globales (éxito/error) ya los gestiona TravelList directamente.
  };


  // --- Renderizado del Componente Principal ---
  return (
    // Contenedor principal de la aplicación con estilos Tailwind
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
            onDriverCreated={handleDriverFormSubmit} // Callback al crear/actualizar conductor
            editingDriver={editingDriver}          // Conductor a editar
            onCancelEdit={handleCancelEditDriver}  // Callback para cancelar edición
            setMessage={setGlobalMessage}          // Setter para mensaje global de éxito
            setError={setGlobalError}              // Setter para mensaje global de error
          />
          <DriverList
            key={refreshDriversKey} // Key para forzar recarga de lista de conductores
            onEditDriver={handleEditDriver}      // Callback para iniciar edición
            onDriverDeleted={handleDriverDeleted} // Callback al eliminar conductor
            setGlobalMessage={setGlobalMessage}  // Setter para mensaje global
            setGlobalError={setGlobalError}      // Setter para error global
          />
        </section>

        {/* Sección de Gestión de Viajes */}
        <section className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Viajes</h2>
          <TravelForm 
            onTravelCreated={handleTravelFormSubmit} // Callback al crear/actualizar viaje
            editingTravel={editingTravel}          // Viaje a editar
            onCancelEdit={handleCancelEditTravel}  // Callback para cancelar edición
            setMessage={setGlobalMessage}
            setError={setGlobalError}
          />
          <TravelList 
            key={refreshTravelsKey} // Key para forzar recarga de lista de viajes
            onEditTravel={handleEditTravel}        // Callback para iniciar edición
            onTravelDeleted={handleTravelDeleted}  // Callback al eliminar viaje
            setGlobalMessage={setGlobalMessage} 
            setGlobalError={setGlobalError}     
          />
        </section>
      </main>
    </div>
  );
}

export default App;
