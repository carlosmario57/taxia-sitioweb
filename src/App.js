import React, { useState } from 'react';
import './App.css';
import DriverList from './DriverList';
import DriverForm from './DriverForm';

function App() {
  const [refreshDrivers, setRefreshDrivers] = useState(0);
  // Nuevo estado para almacenar el conductor que se está editando
  const [editingDriver, setEditingDriver] = useState(null); 

  // Función que se llama cuando se crea un nuevo conductor (desde DriverForm)
  const handleDriverCreated = () => {
    setRefreshDrivers(prev => prev + 1); // Fuerza la actualización de la lista
    setEditingDriver(null); // Asegura que el formulario vuelva a modo "crear" después de una creación exitosa
  };

  // Función que se llama cuando un conductor es eliminado (desde DriverList)
  const handleDriverDeleted = () => {
    setRefreshDrivers(prev => prev + 1); // Fuerza la actualización de la lista
    setEditingDriver(null); // Limpia el estado de edición si el conductor editado es eliminado
  };

  // Nueva función que se llama cuando se hace clic en "Editar" en DriverList
  const handleEditDriver = (driver) => {
    setEditingDriver(driver); // Establece el conductor que se va a editar
    // Podrías añadir un scroll suave al formulario aquí si el formulario está muy abajo
  };

  // Función para cancelar la edición y volver al modo de creación
  const handleCancelEdit = () => {
    setEditingDriver(null);
  };

  return (
    <div 
      className="App" 
      style={{ 
        fontFamily: 'Inter, sans-serif', 
        maxWidth: '900px', 
        margin: '20px auto', 
        padding: '20px', 
        backgroundColor: '#fff', 
        borderRadius: '10px', 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)' 
      }}
    >
      <header 
        style={{ 
          textAlign: 'center', 
          marginBottom: '40px', 
          paddingBottom: '20px', 
          borderBottom: '1px solid #eee' 
        }}
      >
        <h1 style={{ color: '#333', fontSize: '2.5em', marginBottom: '10px' }}>
          Panel de Control CIMCO - CEO
        </h1>
        <p style={{ color: '#666', fontSize: '1.1em' }}>
          ¡Bienvenido, Carlos Mario! Aquí gestionarás a tus conductores y servicios.
        </p>
      </header>

      <main 
        style={{ 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '40px', 
          justifyContent: 'center',
          alignItems: 'center' 
        }}
      >
        {/* Pasa el conductor a editar y las funciones de callback al DriverForm */}
        <DriverForm 
          onDriverCreated={handleDriverCreated} 
          editingDriver={editingDriver} // Pasa el conductor que se está editando
          onCancelEdit={handleCancelEdit} // Pasa la función para cancelar la edición
        />

        {/* Pasa la función onDriverDeleted y onEditDriver a DriverList */}
        <DriverList 
          key={refreshDrivers} 
          onDriverDeleted={handleDriverDeleted} 
          onEditDriver={handleEditDriver} // Pasa la función para iniciar la edición
        />
      </main>
    </div>
  );
}

export default App;