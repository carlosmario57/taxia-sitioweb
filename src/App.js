import React, { useState, useEffect } from 'react'; // Importa useEffect
import axios from 'axios';

import DriverForm from './DriverForm';
import DriverList from './DriverList';
import TravelForm from './TravelForm';
import TravelList from './TravelList';
import AssignDriverModal from './AssignDriverModal'; // NUEVO: Importa el componente modal de asignación

import './App.css'; // Asegúrate de que este archivo esté vacío o contenga tus estilos globales

function App() {
  // --- Estados Globales para Mensajes y Errores ---
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // --- Estados de Datos y Edición ---
  const [drivers, setDrivers] = useState([]); // Ahora App.js gestiona la lista de conductores
  const [travels, setTravels] = useState([]); // App.js también gestionará la lista de viajes (o TravelList la cargará)
  const [editingDriver, setEditingDriver] = useState(null);   // Conductor actualmente en edición
  const [editingTravel, setEditingTravel] = useState(null);     // Viaje actualmente en edición
  const [assigningTravel, setAssigningTravel] = useState(null); // NUEVO: Viaje actualmente en proceso de asignación de conductor

  // --- Estados para Forzar Recarga de Listas (Actualización Automática) ---
  const [refreshDriversKey, setRefreshDriversKey] = useState(0);
  const [refreshTravelsKey, setRefreshTravelsKey] = useState(0);

  // --- Funciones de Carga de Datos (Ahora en App.js para drivers) ---
  const fetchDrivers = async () => {
    try {
      const response = await axios.get('http://localhost:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores en App.js:", err);
      setGlobalError("Error al cargar conductores. Asegúrate de que el backend esté funcionando.");
    }
  };

  // useEffect para cargar conductores al inicio de la aplicación
  useEffect(() => {
    fetchDrivers();
  }, [refreshDriversKey]); // Se recarga si se fuerza un refresh

  // --- Funciones de Callback para DriverForm y DriverList ---

  const handleDriverFormSubmit = () => {
    setEditingDriver(null);
    setRefreshDriversKey(prevKey => prevKey + 1); // Fuerza recarga de DriverList
    setGlobalError(''); // Limpia errores
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    setGlobalMessage('');
    setGlobalError('');
  };

  const handleCancelEditDriver = () => {
    setEditingDriver(null);
    setGlobalMessage('');
    setGlobalError('');
  };

  const handleDriverDeleted = () => {
    setRefreshDriversKey(prevKey => prevKey + 1); // Fuerza recarga de DriverList
    // DriverList ya gestiona su propio mensaje de éxito/error de eliminación
  };

  // --- Funciones de Callback para TravelForm y TravelList ---

  const handleTravelFormSubmit = () => {
    setEditingTravel(null);
    setRefreshTravelsKey(prevKey => prevKey + 1); // Fuerza recarga de TravelList
    setGlobalError('');
  };

  const handleEditTravel = (travel) => {
    setEditingTravel(travel);
    setGlobalMessage('');
    setGlobalError('');
  };

  const handleCancelEditTravel = () => {
    setEditingTravel(null);
    setGlobalMessage('');
    setGlobalError('');
  };

  const handleTravelDeleted = () => {
    setRefreshTravelsKey(prevKey => prevKey + 1); // Fuerza recarga de TravelList
    // TravelList ya gestiona su propio mensaje de éxito/error de eliminación
  };

  // --- NUEVAS Funciones de Callback para Asignación de Conductores ---

  // Se llama desde TravelList cuando se hace clic en "Asignar Conductor"
  const handleAssignDriver = (travel) => {
    setAssigningTravel(travel); // Establece el viaje que se va a asignar
    setGlobalMessage('');
    setGlobalError('');
  };

  // Se llama desde AssignDriverModal para cerrar el modal
  const handleCancelAssign = () => {
    setAssigningTravel(null); // Cierra el modal de asignación
    setGlobalMessage('');
    setGlobalError('');
  };

  // Se llama desde AssignDriverModal cuando la asignación es exitosa
  const handleAssignSuccess = () => {
    setAssigningTravel(null); // Cierra el modal
    setRefreshTravelsKey(prevKey => prevKey + 1); // Fuerza la recarga de TravelList
    // El modal ya establece el mensaje global de éxito
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
            key={refreshDriversKey} // Este key fuerza el re-render y re-fetch
            drivers={drivers} // AHORA App.js pasa la lista de conductores
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
            editingTravel={editingTravel}
            onCancelEdit={handleCancelEditTravel}
            setMessage={setGlobalMessage}
            setError={setGlobalError}
          />
          <TravelList 
            key={refreshTravelsKey} // Este key fuerza el re-render y re-fetch
            onEditTravel={handleEditTravel}
            onTravelDeleted={handleTravelDeleted}
            onAssignDriver={handleAssignDriver} // NUEVO: Pasa la función para iniciar asignación
            setGlobalMessage={setGlobalMessage} 
            setGlobalError={setGlobalError}     
          />
        </section>
      </main>

      {/* NUEVO: Modal de Asignación de Conductor */}
      {assigningTravel && (
        <AssignDriverModal
          travelToAssign={assigningTravel}
          drivers={drivers} // Pasa la lista de conductores disponibles
          onClose={handleCancelAssign}
          onAssignSuccess={handleAssignSuccess}
          setGlobalMessage={setGlobalMessage}
          setGlobalError={setGlobalError}
        />
      )}
    </div>
  );
}

export default App;
