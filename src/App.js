import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DriverForm from './DriverForm';
import DriverList from './DriverList';
import TravelForm from './TravelForm';
import TravelList from './TravelList';
import './App.css';

function App() {
  const [globalMessage, setGlobalMessage] = useState('');
  const [globalError, setGlobalError] = useState('');
  const [loadingDrivers, setLoadingDrivers] = useState(true);
  const [loadingTravels, setLoadingTravels] = useState(true);
  const [drivers, setDrivers] = useState([]);
  const [travels, setTravels] = useState([]);
  const [editingDriver, setEditingDriver] = useState(null);

  const clearGlobalMessages = () => {
    setGlobalMessage('');
    setGlobalError('');
  };

  const fetchDrivers = async () => {
    setLoadingDrivers(true);
    clearGlobalMessages();
    try {
      const response = await axios.get('http://localhost:5000/drivers');
      setDrivers(response.data);
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      setGlobalError("Error al cargar conductores. Asegúrate de que el backend esté funcionando y accesible.");
    } finally {
      setLoadingDrivers(false);
    }
  };

  const fetchTravels = async () => {
    setLoadingTravels(true);
    clearGlobalMessages();
    try {
      const response = await axios.get('http://localhost:5000/viajes');
      setTravels(response.data);
    } catch (err) {
      console.error("Error al obtener viajes:", err);
      setGlobalError("Error al cargar viajes. Asegúrate de que el backend esté funcionando y accesible.");
    } finally {
      setLoadingTravels(false);
    }
  };

  useEffect(() => {
    fetchDrivers();
    fetchTravels();
  }, []);

  const handleDriverFormSubmit = () => {
    fetchDrivers();
    setEditingDriver(null);
    setGlobalMessage('Operación de conductor exitosa.');
    setGlobalError('');
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
    clearGlobalMessages();
  };

  const handleCancelEdit = () => {
    setEditingDriver(null);
    clearGlobalMessages();
  };

  const handleDriverDeleted = (message, isError = false) => {
    fetchDrivers();
    if (isError) {
      setGlobalError(message);
      setGlobalMessage('');
    } else {
      setGlobalMessage(message);
      setGlobalError('');
    }
  };

  const handleTravelFormSubmit = () => {
    fetchTravels();
    setGlobalMessage('Operación de viaje exitosa.');
    setGlobalError('');
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col items-center py-10 font-sans antialiased">
      <header className="w-full max-w-4xl bg-white shadow-lg rounded-lg p-6 mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2">Panel de Control CIMCO - CEO</h1>
        <p className="text-xl text-gray-600">Gestión Centralizada de Conductores y Viajes</p>
      </header>

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

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8 px-4">
        <section className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Conductores</h2>
          <DriverForm
            onDriverCreated={handleDriverFormSubmit}
            editingDriver={editingDriver}
            onCancelEdit={handleCancelEdit}
            setMessage={setGlobalMessage}
            setError={setGlobalError}
            message={globalMessage}
            error={globalError}
          />
          <DriverList
            drivers={drivers}
            loading={loadingDrivers}
            error={globalError}
            onEditDriver={handleEditDriver}
            onDriverDeleted={handleDriverDeleted}
            deleteMessage={globalMessage}
            setDeleteMessage={setGlobalMessage}
          />
        </section>

        <section className="bg-white shadow-lg rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Viajes</h2>
          <TravelForm 
            onTravelCreated={handleTravelFormSubmit}
            setMessage={setGlobalMessage}
            setError={setGlobalError}
            message={globalMessage}
            error={globalError}
          />
          <TravelList 
            travels={travels}
            loading={loadingTravels}
            error={globalError}
          />
        </section>
      </main>
    </div>
  );
}

export default App;