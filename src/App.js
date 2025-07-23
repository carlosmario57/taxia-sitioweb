import React, { useState, useEffect } from 'react';
import axios from 'axios';
import DriverForm from './DriverForm';
import DriverList from './DriverList';
import TravelForm from './TravelForm'; // <-- Nuevo
import TravelList from './TravelList'; // <-- Nuevo

import './App.css'; // Asegúrate de que esta línea esté si tienes estilos CSS globales

function App() {
  // Estado para los conductores (mantener si ya lo tienes)
  const [drivers, setDrivers] = useState([]);
  const [editingDriver, setEditingDriver] = useState(null);
  const [driverMessage, setDriverMessage] = useState('');
  const [driverError, setDriverError] = useState('');

  // Estado para los viajes (NUEVO)
  const [travels, setTravels] = useState([]);
  const [travelMessage, setTravelMessage] = useState(''); // Puedes usarlo para mensajes específicos de viajes
  const [travelError, setTravelError] = useState('');     // Puedes usarlo para errores específicos de viajes


  // Función para obtener conductores (mantener si ya la tienes)
  const fetchDrivers = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/conductores');
      setDrivers(response.data);
      setDriverMessage('');
      setDriverError('');
    } catch (err) {
      console.error("Error al obtener conductores:", err);
      setDriverError('Error al cargar los conductores.');
      setDriverMessage('');
    }
  };

  // Función para obtener viajes (NUEVO)
  const fetchTravels = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:5000/viajes');
      setTravels(response.data);
      setTravelMessage('');
      setTravelError('');
    } catch (err) {
      console.error("Error al obtener viajes:", err);
      setTravelError('Error al cargar los viajes.');
      setTravelMessage('');
    }
  };

  // Cargar conductores y viajes al montar el componente (NUEVO: añadir fetchTravels)
  useEffect(() => {
    fetchDrivers();
    fetchTravels(); // <-- Cargar viajes al inicio
  }, []); // Se ejecuta una vez al montar

  // Funciones para CRUD de Conductores (mantener si ya las tienes, con posibles ajustes)
  const handleDriverCreated = () => {
    setEditingDriver(null); // Limpiar modo de edición
    fetchDrivers(); // Recargar la lista de conductores
    setDriverMessage('Conductor guardado exitosamente.'); // Mensaje para el conductor
  };

  const handleEditDriver = (driver) => {
    setEditingDriver(driver);
  };

  const handleDeleteDriver = async (driverId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este conductor?')) {
      try {
        await axios.delete(`http://127.0.0.1:5000/conductores/${driverId}`);
        setDriverMessage('Conductor eliminado exitosamente.'); // Mensaje para el conductor
        fetchDrivers(); // Recargar la lista
        setDriverError('');
      } catch (err) {
        console.error("Error al eliminar conductor:", err);
        setDriverError('Error al eliminar el conductor.'); // Error para el conductor
        setDriverMessage('');
      }
    }
  };

  // Función para manejar viaje creado (NUEVO)
  const handleTravelCreated = () => {
    fetchTravels(); // Recargar la lista de viajes
    setTravelMessage('Viaje creado exitosamente.'); // Mensaje para el viaje
  };

  // La estructura principal de tu aplicación (NUEVO: añadido TravelForm y TravelList)
  return (
    <div className="min-h-screen bg-gray-100 p-8 flex flex-col items-center">
      <header className="w-full max-w-4xl bg-white shadow-md rounded-lg p-6 mb-8 text-center">
        <h1 className="text-4xl font-extrabold text-purple-700 mb-2">CIMCO Operations</h1>
        <p className="text-xl text-gray-600">Gestión Centralizada de Conductores y Viajes</p>
      </header>

      <main className="w-full max-w-4xl grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Sección de Conductores */}
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Conductores</h2>
          <DriverForm
            onDriverCreated={handleDriverCreated}
            editingDriver={editingDriver}
            setEditingDriver={setEditingDriver}
            message={driverMessage} // Pasar el mensaje de conductor
            setMessage={setDriverMessage}
            error={driverError}   // Pasar el error de conductor
            setError={setDriverError}
          />
          <DriverList
            drivers={drivers}
            onEdit={handleEditDriver}
            onDelete={handleDeleteDriver}
            message={driverMessage} // Mostrar mensaje de conductor
            error={driverError}     // Mostrar error de conductor
          />
        </section>

        {/* Sección de Viajes (NUEVO) */}
        <section className="bg-white shadow-md rounded-lg p-6">
          <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center border-b pb-4">Gestión de Viajes</h2>
          <TravelForm onTravelCreated={handleTravelCreated} /> {/* <-- Añade el formulario de viajes */}
          <TravelList travels={travels} /> {/* <-- Añade la lista de viajes (aún no creada) */}
          {travelMessage && <p className="text-green-500 text-sm mt-4 text-center">{travelMessage}</p>}
          {travelError && <p className="text-red-500 text-sm mt-4 text-center">{travelError}</p>}
        </section>
      </main>
    </div>
  );
}

export default App;