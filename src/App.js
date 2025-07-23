import React, { useState, useEffect } from 'react';
import DriverForm from './DriverForm';
import DriverList from './DriverList';
import TravelForm from './TravelForm'; // Importa el nuevo componente TravelForm
// import TravelList from './TravelList'; // Descomentar cuando crees TravelList.js

function App() {
  // Estado para forzar la recarga de la lista de conductores
  const [refreshDriverListKey, setRefreshDriverListKey] = useState(0);
  // Estado para el conductor que se está editando
  const [editingDriver, setEditingDriver] = useState(null);

  // Estado para forzar la recarga de la lista de viajes
  const [refreshTravelListKey, setRefreshTravelListKey] = useState(0);

  // Función para recargar la lista de conductores
  const handleDriverListRefresh = () => {
    setRefreshDriverListKey(prevKey => prevKey + 1);
    setEditingDriver(null); // Asegurarse de que el formulario de conductor se resetee
  };

  // Función para iniciar la edición de un conductor
  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
  };

  // Función para cancelar la edición de un conductor
  const handleCancelEditDriver = () => {
    setEditingDriver(null);
  };

  // Función para recargar la lista de viajes
  const handleTravelListRefresh = () => {
    setRefreshTravelListKey(prevKey => prevKey + 1);
  };

  return (
    // Contenedor principal de la aplicación
    <div className="min-h-screen bg-gray-100 p-4 font-sans antialiased">
      {/* Encabezado de la aplicación */}
      <header className="py-8 bg-white shadow-md rounded-lg mb-8">
        <h1 className="text-4xl font-bold text-center text-gray-800 mb-2">Panel de Control CIMCO - CEO</h1>
        <p className="text-lg text-center text-gray-600">
          ¡Bienvenido, Carlos Mario! Aquí gestionarás a tus conductores y servicios.
        </p>
      </header>

      {/* Contenedor principal de los formularios y listas */}
      <main className="container mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {/* Sección de Conductores */}
        <section className="md:col-span-1 lg:col-span-1 flex flex-col items-center">
          <DriverForm 
            onDriverCreated={handleDriverListRefresh} 
            editingDriver={editingDriver} 
            onCancelEdit={handleCancelEditDriver} 
          />
          <DriverList 
            key={refreshDriverListKey} // La clave fuerza la recarga del componente
            onDriverDeleted={handleDriverListRefresh} 
            onEditDriver={handleEditDriver} 
          />
        </section>

        {/* Sección de Viajes */}
        <section className="md:col-span-1 lg:col-span-2 flex flex-col items-center">
          <TravelForm onTravelCreated={handleTravelListRefresh} />
          {/*
            Descomentar la siguiente línea cuando crees el componente TravelList.js.
            Por ahora, puedes dejar un mensaje para saber dónde irá.
          */}
          {/* <TravelList key={refreshTravelListKey} onTravelDeleted={handleTravelListRefresh} /> */}
          <div className="mt-8 p-6 border border-gray-200 rounded-lg shadow-md bg-white w-full max-w-2xl text-center text-gray-500 italic">
            Aquí irá la lista de viajes (TravelList.js)
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
