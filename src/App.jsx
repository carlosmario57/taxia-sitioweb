import React, { useState, useEffect, useRef } from 'react';

// Importamos las funciones necesarias de Firebase para la autenticación y el manejo de los estados de usuario.
import { initializeApp, getApps } from "firebase/app";
import { getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

// Importamos las funciones de Firestore necesarias para la base de datos, la lectura de datos en tiempo real, agregar, actualizar y eliminar documentos.
import { getFirestore, collection, onSnapshot, query, addDoc, doc, updateDoc, deleteDoc } from "firebase/firestore";

// Componente para cargar los scripts de Tailwind y otros.
// En una aplicación real de React, Tailwind se configuraría de forma diferente (con npm).
const TailwindCDN = () => (
  <script src="https://cdn.tailwindcss.com"></script>
);

// =================================================================================================
// ARCHIVO: src/App.jsx
// FUNCIÓN: Componente principal de la aplicación que gestiona el flujo de autenticación,
//          la conexión a la base de datos de Firestore y la visualización de datos mejorada.
// =================================================================================================

const App = ({ firebaseConfig }) => {
  // Estado para almacenar la instancia de autenticación y de la base de datos
  const [auth, setAuth] = useState(null);
  const [db, setDb] = useState(null);
  // Estado para el usuario autenticado (null si no hay usuario)
  const [user, setUser] = useState(null);
  // Estado para manejar si la aplicación está cargando
  const [loading, setLoading] = useState(true);

  // Estados para almacenar los datos de conductores y viajes
  const [drivers, setDrivers] = useState([]);
  const [trips, setTrips] = useState([]);

  // Estado para manejar las notificaciones
  const [notification, setNotification] = useState({ message: '', type: '' });

  // Función para mostrar notificaciones temporales
  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: '', type: '' }), 3000); // Ocultar después de 3 segundos
  };

  // =================================================================================================
  // LÓGICA DE INICIALIZACIÓN DE FIREBASE
  // =================================================================================================
  useEffect(() => {
    if (firebaseConfig) { 
      // Inicializamos la aplicación de Firebase si no se ha hecho ya, o usamos la existente.
      const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0];
      console.log("Firebase inicializado con éxito desde App.jsx!");
      
      // Obtenemos la instancia de autenticación y la guardamos en el estado.
      const authInstance = getAuth(app);
      setAuth(authInstance);

      // Obtenemos la instancia de la base de datos de Firestore y la guardamos.
      const dbInstance = getFirestore(app);
      setDb(dbInstance);

      // onAuthStateChanged es un observador que se ejecuta cada vez que el estado de autenticación cambia
      const unsubscribeAuth = onAuthStateChanged(authInstance, (currentUser) => {
        setUser(currentUser); 
        setLoading(false);    
      });

      // La función de limpieza que devuelve useEffect se ejecuta cuando el componente se desmonta,
      // lo que limpia el observador de Firebase para evitar fugas de memoria.
      return () => unsubscribeAuth();
    }
  }, [firebaseConfig]);

  // =================================================================================================
  // LÓGICA DE CONEXIÓN A FIRESTORE Y MEJORA DE VISUALIZACIÓN
  // =================================================================================================
  useEffect(() => {
    // Solo intentamos obtener los datos si tenemos una instancia de la base de datos y un usuario autenticado.
    if (db && user) {
      // Configuramos el observador de la colección de "conductores"
      const driversQuery = query(collection(db, "drivers"));
      const unsubscribeDrivers = onSnapshot(driversQuery, (querySnapshot) => {
        const driversData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setDrivers(driversData);
        console.log("Datos de conductores actualizados en tiempo real:", driversData);
      });

      // Configuramos el observador de la colección de "viajes"
      const tripsQuery = query(collection(db, "trips"));
      const unsubscribeTrips = onSnapshot(tripsQuery, (querySnapshot) => {
        const tripsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Lógica: Buscamos el nombre del conductor para cada viaje
        const tripsWithDriverNames = tripsData.map(trip => {
          const driver = drivers.find(d => d.id === trip.driverId);
          return {
            ...trip,
            driverName: driver ? driver.name : 'Conductor desconocido'
          };
        });
        setTrips(tripsWithDriverNames);
        console.log("Datos de viajes actualizados en tiempo real:", tripsWithDriverNames);
      });

      // Devolvemos una función de limpieza para detener los observadores de Firestore.
      return () => {
        unsubscribeDrivers();
        unsubscribeTrips();
      };
    }
  }, [db, user, drivers]); // Se ejecuta cada vez que 'db', 'user' o 'drivers' cambian

  // ----------------------------------------------------------------------------------
  // LÓGICA DE GESTIÓN DE DATOS EN FIRESTORE (AÑADIMOS EDITAR Y ELIMINAR)
  // ----------------------------------------------------------------------------------
  const handleAddDriver = async (driverData) => {
    try {
      await addDoc(collection(db, "drivers"), driverData);
      showNotification("Conductor agregado con éxito!", "success");
    } catch (error) {
      console.error("Error al agregar el conductor:", error);
      showNotification("Error al agregar el conductor.", "error");
    }
  };

  const handleUpdateDriver = async (id, updatedData) => {
    try {
      const driverDocRef = doc(db, "drivers", id);
      await updateDoc(driverDocRef, updatedData);
      showNotification("Conductor actualizado con éxito!", "success");
    } catch (error) {
      console.error("Error al actualizar el conductor:", error);
      showNotification("Error al actualizar el conductor.", "error");
    }
  };

  const handleDeleteDriver = async (id) => {
    try {
      const driverDocRef = doc(db, "drivers", id);
      await deleteDoc(driverDocRef);
      showNotification("Conductor eliminado con éxito!", "success");
    } catch (error) {
      console.error("Error al eliminar el conductor:", error);
      showNotification("Error al eliminar el conductor.", "error");
    }
  };

  const handleAddTrip = async (tripData) => {
    try {
      await addDoc(collection(db, "trips"), tripData);
      showNotification("Viaje agregado con éxito!", "success");
    } catch (error) {
      console.error("Error al agregar el viaje:", error);
      showNotification("Error al agregar el viaje.", "error");
    }
  };

  const handleUpdateTrip = async (id, updatedData) => {
    try {
      const tripDocRef = doc(db, "trips", id);
      await updateDoc(tripDocRef, updatedData);
      showNotification("Viaje actualizado con éxito!", "success");
    } catch (error) {
      console.error("Error al actualizar el viaje:", error);
      showNotification("Error al actualizar el viaje.", "error");
    }
  };

  const handleDeleteTrip = async (id) => {
    try {
      const tripDocRef = doc(db, "trips", id);
      await deleteDoc(tripDocRef);
      showNotification("Viaje eliminado con éxito!", "success");
    } catch (error) {
      console.error("Error al eliminar el viaje:", error);
      showNotification("Error al eliminar el viaje.", "error");
    }
  };

  // ----------------------------------------------------------------------------------
  // LÓGICA DE INICIO Y CIERRE DE SESIÓN
  // ----------------------------------------------------------------------------------
  const handleLogin = async (email, password) => {
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (error) {
      console.error("Error al iniciar sesión:", error.message);
      showNotification(`Error al iniciar sesión: ${error.message}`, "error");
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Error al cerrar sesión:", error.message);
    } finally {
      setLoading(false);
    }
  };

  // ----------------------------------------------------------------------------------
  // RENDERIZADO CONDICIONAL DE COMPONENTES
  // ----------------------------------------------------------------------------------
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white">
        <TailwindCDN />
        <h1 className="text-xl">Cargando...</h1>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 font-sans antialiased text-white">
      <TailwindCDN />
      {/* Sistema de notificación */}
      {notification.message && (
        <div className={`fixed top-4 right-4 z-50 p-4 rounded-lg shadow-xl text-white transition-opacity duration-500 ease-in-out ${notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}>
          {notification.message}
        </div>
      )}
      
      {user ? (
        <Dashboard 
          user={user} 
          onLogout={handleLogout} 
          drivers={drivers} 
          trips={trips} 
          onAddDriver={handleAddDriver}
          onUpdateDriver={handleUpdateDriver}
          onDeleteDriver={handleDeleteDriver}
          onAddTrip={handleAddTrip}
          onUpdateTrip={handleUpdateTrip}
          onDeleteTrip={handleDeleteTrip}
          showNotification={showNotification}
        />
      ) : (
        <Login onLogin={handleLogin} />
      )}
    </div>
  );
};

// =================================================================================================
// COMPONENTE: LOGIN
// =================================================================================================
const Login = ({ onLogin }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    onLogin(email, password);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center p-4">
      <div className="flex flex-col items-center p-8 bg-gray-800 rounded-xl shadow-lg border border-gray-700 max-w-md w-full animate-fadeIn">
        <span role="img" aria-label="login" className="text-6xl text-purple-400 mb-6 animate-pulse">🔑</span>
        <h1 className="text-4xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-indigo-500">
          Iniciar Sesión
        </h1>
        <form onSubmit={handleSubmit} className="w-full space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo electrónico"
            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            className="w-full p-3 rounded-lg bg-gray-700 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button
            type="submit"
            className="w-full mt-4 px-6 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-full shadow-lg transition-all duration-300 transform hover:scale-105 focus:outline-none focus:ring-4 focus:ring-indigo-500 focus:ring-opacity-50"
          >
            Entrar al Sistema
          </button>
        </form>
      </div>
    </div>
  );
};

// =================================================================================================
// COMPONENTE: DASHBOARD (SE HA MODIFICADO PARA INCLUIR LA LÓGICA DE EDICIÓN Y ELIMINACIÓN)
// =================================================================================================
const Dashboard = ({ user, onLogout, drivers, trips, onAddDriver, onUpdateDriver, onDeleteDriver, onAddTrip, onUpdateTrip, onDeleteTrip, showNotification }) => {
  const [activeTab, setActiveTab] = useState('drivers');
  const [isAddingDriver, setIsAddingDriver] = useState(false);
  const [isAddingTrip, setIsAddingTrip] = useState(false);

  // Estados para manejar la edición y eliminación
  const [editingDriver, setEditingDriver] = useState(null);
  const [editingTrip, setEditingTrip] = useState(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [itemTypeToDelete, setItemTypeToDelete] = useState('');

  // Función para abrir el modal de confirmación de eliminación
  const openDeleteModal = (item, type) => {
    setItemToDelete(item);
    setItemTypeToDelete(type);
    setShowDeleteModal(true);
  };

  // Función para confirmar la eliminación
  const confirmDelete = () => {
    if (itemTypeToDelete === 'driver' && itemToDelete) {
      onDeleteDriver(itemToDelete.id);
    } else if (itemTypeToDelete === 'trip' && itemToDelete) {
      onDeleteTrip(itemToDelete.id);
    }
    setShowDeleteModal(false);
    setItemToDelete(null);
    setItemTypeToDelete('');
  };

  const cancelDelete = () => {
    setShowDeleteModal(false);
    setItemToDelete(null);
    setItemTypeToDelete('');
  };
  
  // Limpiar estados de formularios al cambiar de pestaña
  const handleTabChange = (tab) => {
    setActiveTab(tab);
    setIsAddingDriver(false);
    setIsAddingTrip(false);
    setEditingDriver(null);
    setEditingTrip(null);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-white p-8">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Panel de Control de CIMCO</h1>
        <div className="flex items-center space-x-4 mt-4 md:mt-0">
          <span className="text-sm text-gray-400">Bienvenido, {user.email}</span>
          <button
            onClick={onLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-all duration-300"
          >
            Cerrar Sesión
          </button>
        </div>
      </div>

      {/* Navegación por pestañas */}
      <div className="flex space-x-2 mb-6 border-b border-gray-700">
        <button 
          onClick={() => handleTabChange('drivers')}
          className={`py-2 px-4 transition-colors duration-300 ${activeTab === 'drivers' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
        >
          Conductores ({drivers.length})
        </button>
        <button 
          onClick={() => handleTabChange('trips')}
          className={`py-2 px-4 transition-colors duration-300 ${activeTab === 'trips' ? 'text-indigo-400 border-b-2 border-indigo-400' : 'text-gray-400 hover:text-white'}`}
        >
          Viajes ({trips.length})
        </button>
      </div>

      {/* Contenido de las pestañas */}
      <div className="bg-gray-800 p-6 rounded-xl shadow-lg">
        {/* Botones para agregar nuevos datos */}
        <div className="flex justify-end mb-4">
          {activeTab === 'drivers' && !isAddingDriver && !editingDriver && (
            <button
              onClick={() => setIsAddingDriver(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-300"
            >
              + Agregar Conductor
            </button>
          )}
          {activeTab === 'trips' && !isAddingTrip && !editingTrip && (
            <button
              onClick={() => setIsAddingTrip(true)}
              className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-300"
            >
              + Agregar Viaje
            </button>
          )}
        </div>

        {/* Renderizado condicional de formularios o listas */}
        {isAddingDriver ? (
          <AddDriverForm onAddDriver={onAddDriver} onCancel={() => setIsAddingDriver(false)} showNotification={showNotification} />
        ) : isAddingTrip ? (
          <AddTripForm onAddTrip={onAddTrip} onCancel={() => setIsAddingTrip(false)} drivers={drivers} showNotification={showNotification} />
        ) : editingDriver ? (
          <EditDriverForm driver={editingDriver} onUpdateDriver={onUpdateDriver} onCancel={() => setEditingDriver(null)} showNotification={showNotification} />
        ) : editingTrip ? (
          <EditTripForm trip={editingTrip} onUpdateTrip={onUpdateTrip} onCancel={() => setEditingTrip(null)} drivers={drivers} showNotification={showNotification} />
        ) : (
          <>
            {activeTab === 'drivers' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Lista de Conductores</h2>
                {drivers.length > 0 ? (
                  <ul className="space-y-4">
                    {drivers.map(driver => (
                      <li key={driver.id} className="p-4 bg-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="text-left mb-2 md:mb-0">
                          <p className="font-semibold text-lg text-indigo-300">{driver.name || 'Sin nombre'}</p>
                          <p className="text-sm text-gray-400">{driver.email || 'Sin correo'}</p>
                        </div>
                        <div className="flex space-x-2">
                          <button
                            onClick={() => setEditingDriver(driver)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full transition-colors duration-300"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => openDeleteModal(driver, 'driver')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-full transition-colors duration-300"
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No hay conductores registrados.</p>
                )}
              </div>
            )}
            {activeTab === 'trips' && (
              <div>
                <h2 className="text-2xl font-bold mb-4">Lista de Viajes</h2>
                {trips.length > 0 ? (
                  <ul className="space-y-4">
                    {trips.map(trip => (
                      <li key={trip.id} className="p-4 bg-gray-700 rounded-lg flex flex-col md:flex-row justify-between items-start md:items-center">
                        <div className="text-left mb-2 md:mb-0">
                          <p className="font-semibold text-lg text-teal-300">Viaje a {trip.destination || 'Desconocido'}</p>
                          <p className="text-sm text-gray-400">Conductor: {trip.driverName || 'Sin asignar'}</p>
                          {trip.location && (
                            <p className="text-xs text-gray-500">
                              Lat: {trip.location.latitude}, Lng: {trip.location.longitude}
                            </p>
                          )}
                        </div>
                        <div className="flex space-x-2 items-center">
                          <p className="text-gray-400">Estado: {trip.status || 'Desconocido'}</p>
                          <button
                            onClick={() => setEditingTrip(trip)}
                            className="px-3 py-1 bg-blue-500 hover:bg-blue-600 text-white text-sm rounded-full transition-colors duration-300"
                          >
                            Editar
                          </button>
                          <button
                            onClick={() => openDeleteModal(trip, 'trip')}
                            className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-sm rounded-full transition-colors duration-300"
                          >
                            Eliminar
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-gray-400">No hay viajes registrados.</p>
                )}
              </div>
            )}
          </>
        )}
      </div>
      
      {/* Modal de confirmación para eliminar */}
      {showDeleteModal && (
        <Modal 
          message={`¿Estás seguro de que quieres eliminar este ${itemTypeToDelete === 'driver' ? 'conductor' : 'viaje'}?`} 
          onConfirm={confirmDelete} 
          onCancel={cancelDelete} 
        />
      )}
    </div>
  );
};

// =================================================================================================
// COMPONENTE: FORMULARIO PARA AGREGAR CONDUCTORES
// =================================================================================================
const AddDriverForm = ({ onAddDriver, onCancel }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    const newDriver = { name, email, phone, createdAt: new Date() };
    onAddDriver(newDriver);
    // Limpiamos el formulario y cerramos
    setName('');
    setEmail('');
    setPhone('');
    onCancel();
  };

  return (
    <div className="p-6 bg-gray-700 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">Agregar Nuevo Conductor</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del conductor"
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Número de teléfono"
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-300"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

// =================================================================================================
// NUEVO COMPONENTE: FORMULARIO PARA EDITAR CONDUCTORES
// =================================================================================================
const EditDriverForm = ({ driver, onUpdateDriver, onCancel }) => {
  const [name, setName] = useState(driver.name || '');
  const [email, setEmail] = useState(driver.email || '');
  const [phone, setPhone] = useState(driver.phone || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const updatedData = { name, email, phone };
    onUpdateDriver(driver.id, updatedData);
    onCancel();
  };

  return (
    <div className="p-6 bg-gray-700 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">Editar Conductor</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Nombre del conductor"
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Correo electrónico"
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Número de teléfono"
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-300"
          >
            Actualizar
          </button>
        </div>
      </form>
    </div>
  );
};

// =================================================================================================
// COMPONENTE: FORMULARIO PARA AGREGAR VIAJES
// =================================================================================================
const AddTripForm = ({ onAddTrip, onCancel, drivers }) => {
  const [destination, setDestination] = useState('');
  const [origin, setOrigin] = useState('');
  const [driverId, setDriverId] = useState('');
  const [status, setStatus] = useState('pending');
  // NUEVO: Estados para la ubicación del GPS
  const [latitude, setLatitude] = useState('');
  const [longitude, setLongitude] = useState('');

  // NUEVO: Función para obtener la ubicación del usuario
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude);
          setLongitude(position.coords.longitude);
        },
        (error) => {
          console.error("Error al obtener la ubicación:", error);
          // showNotification("No se pudo obtener la ubicación. Por favor, ingresa los datos manualmente.", "error");
        }
      );
    } else {
      // showNotification("Tu navegador no soporta la API de Geolocation.", "error");
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!driverId) {
      // showNotification("Por favor, selecciona un conductor.", "error");
      return;
    }
    const newTrip = {
      destination,
      origin,
      driverId,
      status,
      // NUEVO: Guardamos la ubicación en la base de datos
      location: {
        latitude: parseFloat(latitude) || null,
        longitude: parseFloat(longitude) || null
      },
      createdAt: new Date(),
    };
    onAddTrip(newTrip);
    // Limpiamos el formulario y cerramos
    setDestination('');
    setOrigin('');
    setDriverId('');
    setStatus('pending');
    setLatitude('');
    setLongitude('');
    onCancel();
  };

  return (
    <div className="p-6 bg-gray-700 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">Agregar Nuevo Viaje</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destino"
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origen"
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        {/* ================================================================================= */}
        {/* LÓGICA CLAVE: Menú desplegable para seleccionar el conductor */}
        {/* ================================================================================= */}
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="" disabled>Selecciona un conductor</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="pending">Pendiente</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>

        {/* NUEVO: Contenedor para los campos de GPS y el botón */}
        <div className="flex items-center space-x-2">
            <input
              type="text"
              value={latitude}
              placeholder="Latitud"
              readOnly
              className="w-1/2 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none cursor-not-allowed"
            />
            <input
              type="text"
              value={longitude}
              placeholder="Longitud"
              readOnly
              className="w-1/2 p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none cursor-not-allowed"
            />
            <button
                type="button"
                onClick={handleGetLocation}
                className="w-auto px-4 py-3 bg-indigo-500 hover:bg-indigo-600 text-white font-semibold rounded-lg transition-colors duration-300"
            >
              Obtener mi ubicación
            </button>
        </div>

        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-full transition-colors duration-300"
          >
            Guardar
          </button>
        </div>
      </form>
    </div>
  );
};

// =================================================================================================
// NUEVO COMPONENTE: FORMULARIO PARA EDITAR VIAJES
// =================================================================================================
const EditTripForm = ({ trip, onUpdateTrip, onCancel, drivers }) => {
  const [destination, setDestination] = useState(trip.destination || '');
  const [origin, setOrigin] = useState(trip.origin || '');
  const [driverId, setDriverId] = useState(trip.driverId || '');
  const [status, setStatus] = useState(trip.status || 'pending');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!driverId) {
      alert("Por favor, selecciona un conductor.");
      return;
    }
    const updatedData = {
      destination,
      origin,
      driverId,
      status,
    };
    onUpdateTrip(trip.id, updatedData);
    onCancel();
  };

  return (
    <div className="p-6 bg-gray-700 rounded-xl shadow-lg">
      <h3 className="text-xl font-bold mb-4">Editar Viaje</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          value={destination}
          onChange={(e) => setDestination(e.target.value)}
          placeholder="Destino"
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <input
          type="text"
          value={origin}
          onChange={(e) => setOrigin(e.target.value)}
          placeholder="Origen"
          className="w-full p-3 rounded-lg bg-gray-800 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
        <select
          value={driverId}
          onChange={(e) => setDriverId(e.target.value)}
          required
          className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="" disabled>Selecciona un conductor</option>
          {drivers.map(driver => (
            <option key={driver.id} value={driver.id}>
              {driver.name}
            </option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value)}
          className="w-full p-3 rounded-lg bg-gray-800 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
        >
          <option value="pending">Pendiente</option>
          <option value="in_progress">En progreso</option>
          <option value="completed">Completado</option>
          <option value="cancelled">Cancelado</option>
        </select>
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 bg-gray-500 hover:bg-gray-600 text-white rounded-full transition-colors duration-300"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors duration-300"
          >
            Actualizar
          </button>
        </div>
      </form>
    </div>
  );
};

// =================================================================================================
// NUEVO COMPONENTE: Modal de confirmación para reemplazar `alert()`
// =================================================================================================
const Modal = ({ message, onConfirm, onCancel }) => {
  return (
    <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-gray-800 p-8 rounded-xl shadow-xl max-w-sm w-full text-center">
        <p className="text-lg mb-6">{message}</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={onConfirm}
            className="px-6 py-2 bg-red-500 hover:bg-red-600 text-white font-semibold rounded-full transition-colors duration-300"
          >
            Confirmar
          </button>
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-gray-500 hover:bg-gray-600 text-white font-semibold rounded-full transition-colors duration-300"
          >
            Cancelar
          </button>
        </div>
      </div>
    </div>
  );
};

// =================================================================================================
// COMPONENTE: Renderizado de la aplicación
// =================================================================================================
// Para que el código funcione en el entorno de desarrollo del canvas,
// asumimos que el componente `App` se renderiza directamente.
// En una aplicación real de React, el código sería algo así en `index.js`:
//
// import { createRoot } from 'react-dom/client';
// const container = document.getElementById('root');
// const root = createRoot(container);
// const firebaseConfig = { ... }; // Tu configuración de Firebase
// root.render(<App firebaseConfig={firebaseConfig} />);

export default App;
