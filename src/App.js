import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { onAuthStateChanged, signOut } from 'firebase/auth'; // Importa funciones de autenticación de Firebase
import { auth } from './firebaseConfig'; // Importa la instancia de autenticación que exportamos

import DriverForm from './DriverForm';
import DriverList from './DriverList';
import TravelForm from './TravelForm';
import TravelList from './TravelList';
import LoginForm from './LoginForm'; // Importa el nuevo componente LoginForm

import './App.css'; // Asegúrate de que este archivo esté vacío o contenga tus estilos globales

function App() {
  // --- Estados Globales para Mensajes y Errores ---
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // --- Estado de Usuario Autenticado ---
  const [user, setUser] = useState(null); // Almacena el objeto de usuario autenticado

  // --- Estados para Edición ---
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingTravel, setEditingTravel] = useState(null);

  // --- Estados para Forzar Recarga de Listas ---
  const [refreshDriversKey, setRefreshDriversKey] = useState(0);
  const [refreshTravelsKey, setRefreshTravelsKey] = useState(0);

  // --- useEffect para escuchar cambios en el estado de autenticación ---
  // Este efecto se ejecuta una vez al montar el componente y se mantiene escuchando.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Actualiza el estado 'user' con el usuario actual (o null si no hay)
      if (currentUser) {
        setGlobalMessage('Sesión iniciada exitosamente.');
        setGlobalError('');
      } else {
        setGlobalMessage('Sesión cerrada. Por favor, inicia sesión.');
        setGlobalError('');
      }
    });

    // La función de limpieza se ejecuta cuando el componente se desmonta
    return () => unsubscribe();
  }, []); // El array vacío asegura que se ejecute solo una vez al montar

  // --- Funciones de Callback para Conductores ---
  const handleDriverFormSubmit = () => {
    setEditingDriver(null);
    setRefreshDriversKey(prevKey => prevKey + 1);
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
    setRefreshDriversKey(prevKey => prevKey + 1);
  };

  // --- Funciones de Callback para Viajes ---
  const handleTravelFormSubmit = () => {
    setEditingTravel(null);
    setRefreshTravelsKey(prevKey => prevKey + 1);
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
    setRefreshTravelsKey(prevKey => prevKey + 1);
  };

  // --- Función para Cerrar Sesión ---
  const handleLogout = async () => {
    try {
      await signOut(auth); // Cierra la sesión de Firebase
      setGlobalMessage('Sesión cerrada exitosamente.');
      setGlobalError('');
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setGlobalError('Error al cerrar sesión. Intenta de nuevo.');
    }
  };


  // --- Renderizado Condicional Basado en la Autenticación ---
  if (!user) {
    // Si no hay usuario autenticado, muestra el formulario de login
    return (
      <LoginForm 
        setMessage={setGlobalMessage} 
        setError={setGlobalError} 
      />
    );
  }

  // Si hay usuario autenticado, muestra el panel de control completo
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-sans antialiased">
      
      {/* Encabezado del Panel */}
      <header className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6 mb-8 text-center relative">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2">CIMCO Operations</h1>
        <p className="text-xl text-gray-600">Gestión Centralizada de Conductores y Viajes</p>
        
        {/* Botón de Cerrar Sesión */}
        <button
          onClick={handleLogout}
          className="absolute top-4 right-4 bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-full text-sm transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
        >
          Cerrar Sesión
        </button>
        {user && <p className="text-sm text-gray-500 mt-2">Logueado como: {user.email}</p>} {/* Muestra el correo del usuario */}
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
            key={refreshDriversKey}
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
            key={refreshTravelsKey}
            onEditTravel={handleEditTravel}
            onTravelDeleted={handleTravelDeleted}
            setGlobalMessage={setGlobalMessage} 
            setGlobalError={setGlobalError}     
          />
        </section>
      </main>
    </div>
  );
}

export default App;