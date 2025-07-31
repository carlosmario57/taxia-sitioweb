import React, { useState, useEffect } from 'react';
import { getAuth, onAuthStateChanged, signOut } from 'firebase/auth'; // Importa getAuth, onAuthStateChanged, signOut

// --- Importaciones de Componentes desde sus nuevas ubicaciones ---
// ¡IMPORTANTE! Las rutas ahora apuntan a las subcarpetas dentro de 'components'
import DriverForm from './components/drivers/DriverForm.jsx';
import DriverList from './components/drivers/DriverList.jsx';
import TravelForm from './components/travels/TravelForm.jsx';
import TravelList from './components/travels/TravelList.jsx';
import LoginForm from './components/auth/LoginForm.jsx'; // Importa el componente LoginForm desde su nueva ubicación
// import AssignDriverModal from './components/modals/AssignDriverModal.jsx'; // Descomenta si lo necesitas y ya lo creaste

import './App.css'; // Estilos CSS de la aplicación

function App() {
  // --- Estados Globales para Mensajes y Errores ---
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');

  // --- Estados para Edición ---
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingTravel, setEditingTravel] = useState(null);

  // --- Estados para Forzar Recarga de Listas (Actualización Automática) ---
  // Estos keys se incrementan para forzar un re-render y re-fetch en los useEffect de las listas
  const [refreshDriversKey, setRefreshDriversKey] = useState(0);
  const [refreshTravelsKey, setRefreshTravelsKey] = useState(0);

  // --- Estado de Autenticación de Usuario ---
  const [user, setUser] = useState(null); // Almacena el objeto de usuario de Firebase
  const [authLoading, setAuthLoading] = useState(true); // Para saber si Firebase está verificando el estado de autenticación

  // useEffect para escuchar cambios en el estado de autenticación de Firebase
  useEffect(() => {
    const auth = getAuth();
    // onAuthStateChanged se dispara cuando el estado de autenticación cambia (login, logout, inicio de app)
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser); // Establece el usuario actual (o null si no hay)
      setAuthLoading(false); // La verificación inicial ha terminado
      // Limpia mensajes si el estado de auth cambia
      setGlobalMessage('');
      setGlobalError('');
    });

    // Esta función de retorno se ejecuta cuando el componente se desmonta
    return () => unsubscribe();
  }, []); // El array de dependencias vacío asegura que se ejecute solo una vez al montar

  // --- Funciones de Callback para DriverForm y DriverList ---
  const handleDriverFormSubmit = () => {
    setEditingDriver(null);
    setRefreshDriversKey(prevKey => prevKey + 1);
    // IMPORTANTE: DriverForm ya establece el mensaje global de éxito.
    // Aquí solo limpiamos el error si lo hubiera.
    setGlobalError('');
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
    // DriverList ya gestiona su propio mensaje de éxito/error de eliminación y lo propaga globalmente
  };

  // --- Funciones de Callback para TravelForm y TravelList ---
  const handleTravelFormSubmit = () => {
    setEditingTravel(null);
    setRefreshTravelsKey(prevKey => prevKey + 1);
    // IMPORTANTE: TravelForm ya establece el mensaje global de éxito.
    // Aquí solo limpiamos el error si lo hubiera.
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
    setRefreshTravelsKey(prevKey => prevKey + 1);
    // TravelList ya gestiona su propio mensaje de éxito/error de eliminación y lo propaga globalmente
  };

  // --- Función para manejar el éxito del login desde LoginForm ---
  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser); // Actualiza el estado del usuario en App.jsx
    setGlobalMessage('¡Has iniciado sesión exitosamente!');
    setGlobalError(''); // Limpia cualquier error previo
  };

  // --- Función para manejar el cierre de sesión ---
  const handleLogout = async () => {
    const auth = getAuth();
    try {
      await signOut(auth);
      setGlobalMessage('Has cerrado sesión correctamente.');
      setGlobalError('');
      // No necesitamos llamar a setUser(null) aquí directamente,
      // onAuthStateChanged se encargará de actualizar el estado `user` automáticamente.
    } catch (error) {
      console.error("Error al cerrar sesión:", error);
      setGlobalError(`Error al cerrar sesión: ${error.message}`);
    }
  };

  // Si aún estamos verificando el estado de autenticación, muestra un mensaje de carga.
  // Esto es importante para evitar que los formularios intenten obtener el token antes de que se sepa si hay usuario.
  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-xl text-gray-700">Cargando autenticación...</p>
      </div>
    );
  }

  // Si no hay usuario autenticado, muestra el formulario de inicio de sesión.
  if (!user) {
    return (
      <LoginForm 
        onLoginSuccess={handleLoginSuccess} 
        setGlobalMessage={setGlobalMessage} // Pasa los setters para que LoginForm pueda mostrar mensajes globales
        setGlobalError={setGlobalError}    // Pasa los setters para que LoginForm pueda mostrar errores globales
      />
    );
  }

  // Si el usuario está autenticado, muestra el contenido principal de la aplicación.
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center font-sans antialiased">

      {/* Encabezado del Panel */}
      <header className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6 mb-8 text-center relative">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2">CIMCO Operations</h1>
        <p className="text-xl text-gray-600">Gestión Centralizada de Conductores y Viajes</p>
        
        {user && (
          <div className="absolute top-4 right-4 flex items-center space-x-3">
            <span className="text-gray-700 text-sm font-medium">
              Hola, {user.email || user.displayName || 'Usuario'}
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 hover:bg-red-600 text-white text-sm px-3 py-1 rounded-md transition duration-150 ease-in-out focus:outline-none focus:ring-2 focus:ring-red-400"
            >
              Cerrar Sesión
            </button>
          </div>
        )}
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