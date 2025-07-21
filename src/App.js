import React, { useState } from 'react';
import './App.css';
import DriverList from './DriverList';
import DriverForm from './DriverForm';

function App() {
  const [refreshDrivers, setRefreshDrivers] = useState(0);
  const [editingDriver, setEditingDriver] = useState(null); 

  const handleDriverCreated = () => {
    setRefreshDrivers(prev => prev + 1);
    setEditingDriver(null);
  };

  const handleDriverDeleted = () => {
    setRefreshDrivers(prev => prev + 1);
    setEditingDriver(null);
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
  };

  const handleCancelEdit = () => {
    setEditingDriver(null);
  };

  return (
    // Añadimos clases de Tailwind aquí
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 font-inter">
      <header className="text-center mb-10 pb-5 border-b border-gray-200 w-full max-w-2xl">
        <h1 className="text-4xl font-bold text-gray-800 mb-2">
          Panel de Control CIMCO - CEO
        </h1>
        <p className="text-lg text-gray-600">
          ¡Bienvenido, Carlos Mario! Aquí gestionarás a tus conductores y servicios.
        </p>
      </header>

      <main className="flex flex-col md:flex-row gap-10 justify-center items-start w-full max-w-4xl px-4">
        <DriverForm 
          onDriverCreated={handleDriverCreated} 
          editingDriver={editingDriver} 
          onCancelEdit={handleCancelEdit} 
        />
        <DriverList 
          key={refreshDrivers} 
          onDriverDeleted={handleDriverDeleted} 
          onEditDriver={handleEditDriver} 
        />
      </main>
    </div>
  );
}

export default App;