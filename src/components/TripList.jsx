import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Componente para el modal de confirmación. Reemplaza `window.confirm` para una mejor experiencia de usuario.
// Muestra un mensaje y botones para confirmar o cancelar una acción.
const ConfirmationModal = ({ isOpen, message, onConfirm, onCancel }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 w-full max-w-sm transform transition-all duration-300 scale-100">
        <p className="text-gray-800 text-lg font-medium mb-4">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={onConfirm}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            Eliminar
          </button>
        </div>
      </div>
    </div>
  );
};

// Componente para el formulario de adición/edición de un viaje.
// Se ha mejorado el manejo de errores y la sincronización con los datos de edición.
const TripEditForm = ({ tripToEdit, onSave, onCancel, errorMessage, setErrorMessage }) => {
  const [formData, setFormData] = useState({
    destination: '',
    startDate: '',
    endDate: '',
  });

  // Efecto para sincronizar el estado del formulario con el viaje seleccionado para editar.
  useEffect(() => {
    if (tripToEdit) {
      setFormData({
        destination: tripToEdit.destination || '',
        startDate: tripToEdit.startDate || '',
        endDate: tripToEdit.endDate || '',
      });
    } else {
      // Limpiar el formulario si no hay un viaje seleccionado.
      setFormData({
        destination: '',
        startDate: '',
        endDate: '',
      });
    }
  }, [tripToEdit]);

  // Maneja el cambio de los campos del formulario.
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({ ...prevData, [name]: value }));
    // Limpiar el mensaje de error cuando el usuario empieza a escribir.
    setErrorMessage('');
  };

  // Maneja el envío del formulario.
  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <div className="p-6 bg-white rounded-2xl shadow-lg mb-6 w-full transform transition-all duration-300 hover:shadow-xl">
      <h2 className="text-2xl font-extrabold text-gray-800 mb-4 text-center">
        {tripToEdit ? 'Editar Viaje' : 'Añadir Nuevo Viaje'}
      </h2>
      <form onSubmit={handleSubmit}>
        {errorMessage && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-xl mb-4" role="alert">
            <span className="block sm:inline">{errorMessage}</span>
          </div>
        )}
        <div className="mb-4">
          <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="destination">
            Destino
          </label>
          <input
            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 transition-shadow"
            id="destination"
            name="destination"
            type="text"
            placeholder="Ej: París, Francia"
            value={formData.destination}
            onChange={handleChange}
            required
          />
        </div>
        <div className="mb-4 flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="w-full sm:w-1/2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
              Fecha de Inicio
            </label>
            <input
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 transition-shadow"
              id="startDate"
              name="startDate"
              type="date"
              value={formData.startDate}
              onChange={handleChange}
              required
            />
          </div>
          <div className="w-full sm:w-1/2">
            <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
              Fecha de Fin
            </label>
            <input
              className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline focus:ring-2 focus:ring-blue-500 transition-shadow"
              id="endDate"
              name="endDate"
              type="date"
              value={formData.endDate}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="flex items-center justify-between mt-6">
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105"
            type="submit"
          >
            {tripToEdit ? 'Guardar Cambios' : 'Añadir Viaje'}
          </button>
          {tripToEdit && (
            <button
              className="bg-gray-400 hover:bg-gray-500 text-white font-bold py-2 px-4 rounded-xl focus:outline-none focus:shadow-outline transition-all duration-300 transform hover:scale-105"
              type="button"
              onClick={onCancel}
            >
              Cancelar
            </button>
          )}
        </div>
      </form>
    </div>
  );
};

// Componente para renderizar la lista de viajes.
const TripList = ({ trips, onEdit, onDelete }) => {
  // Estilos con Tailwind
  const tailwindStyles = {
    card: 'bg-white shadow-lg rounded-2xl p-6 mb-4 transform transition-all duration-300 hover:shadow-xl',
    subtitle: 'text-2xl font-extrabold text-gray-900 mb-4 text-center',
    listItem: 'bg-gray-50 rounded-xl p-4 mb-2 flex flex-col sm:flex-row justify-between items-start sm:items-center shadow-sm hover:bg-blue-50 transition-all duration-200',
    itemText: 'text-lg text-gray-700 font-bold',
    itemDates: 'text-sm text-gray-500 mt-1 sm:mt-0',
    buttonGroup: 'flex items-center space-x-2 mt-3 sm:mt-0',
    editButton: 'bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-colors',
    deleteButton: 'bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors',
  };

  // Función auxiliar para formatear la fecha a un formato legible.
  const formatDate = (dateString) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    return `${day}/${month}/${year}`;
  };

  // Validación defensiva: Si 'trips' no es un array, se inicializa como un array vacío.
  const validTrips = Array.isArray(trips) ? trips : [];

  return (
    <div className={tailwindStyles.card}>
      <h2 className={tailwindStyles.subtitle}>Viajes Guardados ({validTrips.length})</h2>
      {validTrips.length > 0 ? (
        <ul>
          {validTrips.map(trip => (
            <li key={trip.id} className={tailwindStyles.listItem}>
              <div className="flex-1">
                <span className={tailwindStyles.itemText}>{trip.destination}</span>
                <p className={tailwindStyles.itemDates}>{formatDate(trip.startDate)} - {formatDate(trip.endDate)}</p>
              </div>
              <div className={tailwindStyles.buttonGroup}>
                <button
                  className={tailwindStyles.editButton}
                  onClick={() => onEdit(trip)}
                >
                  {/* Icono de edición (lápiz) */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                  </svg>
                </button>
                <button
                  className={tailwindStyles.deleteButton}
                  onClick={() => onDelete(trip.id)}
                >
                  {/* Icono de eliminación (papelera) */}
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </button>
              </div>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-center text-gray-500 mt-4">
          No hay viajes guardados. ¡Añade uno para empezar!
        </p>
      )}
    </div>
  );
};

// Componente principal de la aplicación.
// Renombrado a `TripManager` para ser más descriptivo.
const TripManager = () => {
  // Estado para la lista de viajes y la carga de datos.
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingTrip, setEditingTrip] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Estados para el modal de confirmación de eliminación.
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [tripToDeleteId, setTripToDeleteId] = useState(null);

  // Estados de Firebase y autenticación.
  const [db, setDb] = useState(null);
  const [auth, setAuth] = useState(null);
  const [userId, setUserId] = useState(null);
  const [isAuthReady, setIsAuthReady] = useState(false);

  // Variables globales del entorno.
  const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
  const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
  const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

  const tailwindStyles = {
    appContainer: 'min-h-screen bg-gray-100 p-4 sm:p-8 font-inter text-gray-800 flex flex-col items-center',
    mainContent: 'w-full max-w-2xl',
    title: 'text-4xl font-extrabold text-blue-800 mb-6 text-center drop-shadow-md',
    loading: 'text-center text-gray-500 text-xl font-medium mt-10 animate-pulse',
    userIdContainer: 'bg-blue-100 text-blue-800 p-3 rounded-xl mt-4 mb-6 text-sm font-mono break-all w-full text-center shadow-inner',
  };

  // Efecto para la inicialización de Firebase y la autenticación del usuario.
  useEffect(() => {
    if (db) return;

    try {
      const app = initializeApp(firebaseConfig);
      const firestoreDb = getFirestore(app);
      const firebaseAuth = getAuth(app);

      setDb(firestoreDb);
      setAuth(firebaseAuth);

      const unsubscribe = onAuthStateChanged(firebaseAuth, async (user) => {
        if (user) {
          console.log('Usuario autenticado:', user.uid);
          setUserId(user.uid);
        } else {
          try {
            console.log('No hay usuario autenticado. Intentando iniciar sesión...');
            if (initialAuthToken) {
              await signInWithCustomToken(firebaseAuth, initialAuthToken);
            } else {
              await signInAnonymously(firebaseAuth);
            }
          } catch (error) {
            console.error("Error al iniciar sesión:", error);
          }
        }
        setIsAuthReady(true);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error al inicializar Firebase:', error);
    }
  }, [db, firebaseConfig, initialAuthToken]);

  // Efecto para cargar los viajes una vez que el usuario está autenticado.
  useEffect(() => {
    if (!db || !userId || !isAuthReady) {
      console.log('Esperando por la autenticación para cargar los datos...');
      return;
    }

    setLoading(true);
    const tripsPath = `artifacts/${appId}/users/${userId}/viajes`;
    console.log('Path de viajes:', tripsPath);
    const qTrips = query(collection(db, tripsPath));

    const unsubscribe = onSnapshot(qTrips, (querySnapshot) => {
      const tripsData = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const sortedTrips = tripsData.sort((a, b) => {
        if (a.createdAt && b.createdAt) {
          return b.createdAt.toDate().getTime() - a.createdAt.toDate().getTime();
        }
        return 0;
      });
      setTrips(sortedTrips);
      setLoading(false);
      console.log('Viajes cargados:', tripsData);
    }, (error) => {
      console.error("Error al cargar viajes:", error);
      setLoading(false);
    });

    return () => unsubscribe();

  }, [db, userId, appId, isAuthReady]);

  // Función para guardar o actualizar un viaje.
  const handleSaveTrip = async (newTripData) => {
    if (!db || !userId) return;

    // Validación básica de los campos del formulario.
    if (!newTripData.destination || !newTripData.startDate || !newTripData.endDate) {
      setErrorMessage('Por favor, rellena todos los campos del formulario.');
      return;
    }

    try {
      const tripsPath = `artifacts/${appId}/users/${userId}/viajes`;
      if (editingTrip) {
        // Actualizar el documento existente.
        const tripDocRef = doc(db, tripsPath, editingTrip.id);
        await updateDoc(tripDocRef, newTripData);
        setEditingTrip(null);
      } else {
        // Añadir un nuevo documento.
        await addDoc(collection(db, tripsPath), {
          ...newTripData,
          createdAt: serverTimestamp(),
        });
      }
      setErrorMessage('');
    } catch (error) {
      console.error("Error al guardar el viaje:", error);
      setErrorMessage('Error al guardar el viaje. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para iniciar el proceso de eliminación.
  const handleInitiateDelete = (tripId) => {
    setTripToDeleteId(tripId);
    setIsModalOpen(true);
  };

  // Función para confirmar la eliminación de un viaje.
  const handleDeleteConfirm = async () => {
    if (!db || !userId || !tripToDeleteId) return;

    try {
      const tripsPath = `artifacts/${appId}/users/${userId}/viajes`;
      const tripDocRef = doc(db, tripsPath, tripToDeleteId);
      await deleteDoc(tripDocRef);
      setEditingTrip(null);
      setErrorMessage('');
      setIsModalOpen(false); // Cerrar el modal
      setTripToDeleteId(null);
    } catch (error) {
      console.error("Error al eliminar el viaje:", error);
      setErrorMessage('Error al eliminar el viaje. Por favor, inténtalo de nuevo.');
    }
  };

  // Función para cancelar la eliminación.
  const handleDeleteCancel = () => {
    setIsModalOpen(false);
    setTripToDeleteId(null);
  };

  return (
    <div className={tailwindStyles.appContainer}>
      <div className={tailwindStyles.mainContent}>
        <h1 className={tailwindStyles.title}>Mi Gestor de Viajes ✈️</h1>
        {userId && (
          <div className={tailwindStyles.userIdContainer}>
            <span>ID de Usuario:</span>
            <pre>{userId}</pre>
          </div>
        )}

        {loading ? (
          <p className={tailwindStyles.loading}>Cargando datos...</p>
        ) : (
          <>
            <TripEditForm
              tripToEdit={editingTrip}
              onSave={handleSaveTrip}
              onCancel={() => {
                setEditingTrip(null);
                setErrorMessage('');
              }}
              errorMessage={errorMessage}
              setErrorMessage={setErrorMessage}
            />
            <TripList
              trips={trips}
              onEdit={setEditingTrip}
              onDelete={handleInitiateDelete} // Usa la nueva función para abrir el modal
            />
          </>
        )}
      </div>
      <ConfirmationModal
        isOpen={isModalOpen}
        message="¿Estás seguro de que quieres eliminar este viaje? Esta acción no se puede deshacer."
        onConfirm={handleDeleteConfirm}
        onCancel={handleDeleteCancel}
      />
    </div>
  );
};

export default TripManager;
