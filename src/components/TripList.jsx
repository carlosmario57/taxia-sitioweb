import React, { useState, useEffect } from 'react';
import { initializeApp } from 'firebase/app';
import { getAuth, signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { getFirestore, collection, onSnapshot, query, addDoc, updateDoc, doc, deleteDoc, serverTimestamp } from 'firebase/firestore';

// Importaciones de Firebase

// Componente para el formulario de edición (simulando TripEditForm.jsx)
const TripEditForm = ({ tripToEdit, onSave, onCancel, errorMessage, setErrorMessage }) => {
    const [formData, setFormData] = useState({
        destination: '',
        startDate: '',
        endDate: '',
    });

    // Sincronizar el estado del formulario cuando se selecciona un nuevo viaje para editar
    useEffect(() => {
        if (tripToEdit) {
            setFormData({
                destination: tripToEdit.destination || '',
                startDate: tripToEdit.startDate || '',
                endDate: tripToEdit.endDate || '',
            });
        } else {
            // Limpiar el formulario si no hay un viaje seleccionado
            setFormData({
                destination: '',
                startDate: '',
                endDate: '',
            });
        }
    }, [tripToEdit]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prevData) => ({ ...prevData, [name]: value }));
        // Limpiar el mensaje de error cuando el usuario comienza a escribir
        setErrorMessage('');
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        // Llamar a la función de guardado con los datos del formulario
        onSave(formData);
    };

    return (
        <div className="p-6 bg-white rounded-xl shadow-lg mb-6 w-full">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {tripToEdit ? 'Editar Viaje' : 'Añadir Nuevo Viaje'}
            </h2>
            <form onSubmit={handleSubmit}>
                {/* Mostrar mensaje de error si existe */}
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
                        className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                        id="destination"
                        name="destination"
                        type="text"
                        placeholder="Ej: París, Francia"
                        value={formData.destination}
                        onChange={handleChange}
                        required
                    />
                </div>
                <div className="mb-4 flex space-x-4">
                    <div className="w-1/2">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="startDate">
                            Fecha de Inicio
                        </label>
                        <input
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
                            id="startDate"
                            name="startDate"
                            type="date"
                            value={formData.startDate}
                            onChange={handleChange}
                            required
                        />
                    </div>
                    <div className="w-1/2">
                        <label className="block text-gray-700 text-sm font-bold mb-2" htmlFor="endDate">
                            Fecha de Fin
                        </label>
                        <input
                            className="shadow appearance-none border rounded-lg w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline"
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
        card: 'bg-white shadow-lg rounded-2xl p-6 mb-4',
        subtitle: 'text-2xl font-bold text-gray-900 mb-4',
        listItem: 'bg-gray-50 rounded-xl p-4 mb-2 flex justify-between items-center shadow-sm hover:bg-blue-50 transition-all duration-200',
        itemText: 'text-lg text-gray-700 font-medium',
        itemDates: 'text-sm text-gray-500',
        buttonGroup: 'flex items-center space-x-2',
        editButton: 'bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600 transition-colors',
        deleteButton: 'bg-red-500 text-white p-2 rounded-lg hover:bg-red-600 transition-colors',
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
                                <p className={tailwindStyles.itemDates}>{trip.startDate} - {trip.endDate}</p>
                            </div>
                            <div className={tailwindStyles.buttonGroup}>
                                <button
                                    className={tailwindStyles.editButton}
                                    onClick={() => onEdit(trip)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                                    </svg>
                                </button>
                                <button
                                    className={tailwindStyles.deleteButton}
                                    onClick={() => onDelete(trip.id)}
                                >
                                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                                        <path fillRule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                                    </svg>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            ) : (
                <p className="text-center text-gray-500">No hay viajes guardados. ¡Añade uno para empezar!</p>
            )}
        </div>
    );
};

// Componente principal de la aplicación
const App = () => {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [db, setDb] = useState(null);
    const [auth, setAuth] = useState(null);
    const [userId, setUserId] = useState(null);
    const [isAuthReady, setIsAuthReady] = useState(false);
    const [editingTrip, setEditingTrip] = useState(null);
    const [errorMessage, setErrorMessage] = useState(''); // Nuevo estado para los mensajes de error

    const appId = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';
    const firebaseConfig = typeof __firebase_config !== 'undefined' ? JSON.parse(__firebase_config) : {};
    const initialAuthToken = typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

    const tailwindStyles = {
        appContainer: 'min-h-screen bg-gray-100 p-8 font-inter text-gray-800 flex flex-col items-center',
        mainContent: 'w-full max-w-2xl',
        title: 'text-4xl font-extrabold text-blue-800 mb-6 text-center',
        loading: 'text-center text-gray-500 text-xl font-medium mt-10',
        userIdContainer: 'bg-blue-100 text-blue-800 p-3 rounded-xl mt-4 mb-6 text-sm font-mono break-all w-full text-center',
    };

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

    const handleSaveTrip = async (newTripData) => {
        if (!db || !userId) return;

        // --- NUEVA VALIDACIÓN Y MANEJO DE ERRORES ---
        if (!newTripData.destination || !newTripData.startDate || !newTripData.endDate) {
            setErrorMessage('Por favor, rellena todos los campos del formulario.');
            return;
        }

        try {
            const tripsPath = `artifacts/${appId}/users/${userId}/viajes`;
            if (editingTrip) {
                const tripDocRef = doc(db, tripsPath, editingTrip.id);
                await updateDoc(tripDocRef, newTripData);
                setEditingTrip(null);
            } else {
                await addDoc(collection(db, tripsPath), {
                    ...newTripData,
                    createdAt: serverTimestamp(),
                });
            }
            setErrorMessage(''); // Limpiar el error si la operación fue exitosa
        } catch (error) {
            console.error("Error al guardar el viaje:", error);
            setErrorMessage('Error al guardar el viaje. Por favor, inténtalo de nuevo.');
        }
    };

    const handleDeleteTrip = async (tripId) => {
        if (!db || !userId) return;

        // TODO: Reemplazar el confirm con una ventana modal personalizada para una mejor UX
        if (window.confirm("¿Estás seguro de que quieres eliminar este viaje?")) {
            try {
                const tripsPath = `artifacts/${appId}/users/${userId}/viajes`;
                const tripDocRef = doc(db, tripsPath, tripId);
                await deleteDoc(tripDocRef);
                setEditingTrip(null);
                setErrorMessage(''); // Limpiar el error si la operación fue exitosa
            } catch (error) {
                console.error("Error al eliminar el viaje:", error);
                setErrorMessage('Error al eliminar el viaje. Por favor, inténtalo de nuevo.');
            }
        }
    };

    return (
        <div className={tailwindStyles.appContainer}>
            <div className={tailwindStyles.mainContent}>
                <h1 className={tailwindStyles.title}>Mi Gestor de Viajes</h1>
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
                            errorMessage={errorMessage} // Pasar el mensaje de error al componente del formulario
                            setErrorMessage={setErrorMessage} // Pasar la función para limpiar el error
                        />
                        {/* Se pasa un array vacío por defecto para evitar el error si 'trips' fuera undefined */}
                        <TripList
                            trips={trips || []}
                            onEdit={setEditingTrip}
                            onDelete={handleDeleteTrip}
                        />
                    </>
                )}
            </div>
        </div>
    );
};

export default App;